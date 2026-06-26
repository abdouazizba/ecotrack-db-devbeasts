const schedule = require('node-schedule');
const containerClient = require('./ContainerServiceClient');
const EventService = require('./EventService');

/**
 * IoT MEASUREMENT SIMULATOR
 *
 * Every 30 seconds:
 *  - Covers ALL containers (not a random sample)
 *  - Each container has 3 real capteurs: REMPLISSAGE, TEMPERATURE, SIGNAL
 *  - Sends one measurement per capteur directly to container-service (no self-HTTP)
 *  - Publishes RabbitMQ alerts when fill > 80%
 *  - Processes containers in parallel chunks of 20 to avoid overwhelming
 */

const CHUNK_SIZE = 20; // concurrent HTTP calls to container-service

class IoTMeasurementSimulator {
  constructor() {
    this.job = null;
    this.isRunning = false;

    // Map<containerId, { currentFill, alertsSent }>
    this.containerState = new Map();

    // Map<containerId, Array<{ id, type }>> — capteurs per container
    this.capteurMap = new Map();

    this.stats = {
      totalMeasurements: 0,
      alertsTriggered: 0,
      startTime: null,
      lastBatchAt: null,
      lastBatchCount: 0,
    };
  }

  // ─── Initialisation ────────────────────────────────────────────────────────

  async initialize() {
    console.log('🔌 IoT Simulator: Fetching containers and sensors...');

    const [containers, capteurMap] = await Promise.all([
      containerClient.getContainers(),
      containerClient.getCapteurs(),
    ]);

    if (containers.length === 0) {
      throw new Error('No containers returned by container-service. Is it running?');
    }

    this.capteurMap = capteurMap;

    for (const c of containers) {
      this.containerState.set(c.id, {
        currentFill: 10 + Math.random() * 40, // start 10–50 %
        alertsSent: 0,
      });
    }

    console.log(`✓ ${containers.length} containers loaded`);
    console.log(`✓ ${capteurMap.size} containers have registered capteurs`);

    const totalCapteurs = Array.from(capteurMap.values()).reduce((s, a) => s + a.length, 0);
    console.log(`✓ ${totalCapteurs} IoT capteurs ready\n`);

    return containers.length;
  }

  // ─── Sensor reading generation ─────────────────────────────────────────────

  generateFillProgression(currentFill) {
    const r = Math.random();
    if (r < 0.75) return Math.min(100, currentFill + Math.random() * 1.5 + 0.3); // gradual fill
    if (r < 0.90) return Math.max(0, currentFill - (Math.random() * 25 + 5));    // collection
    return currentFill;                                                            // unchanged
  }

  readingsForCapteur(type, fillPct) {
    switch (type) {
      case 'REMPLISSAGE':
        return {
          taux_remplissage: parseFloat(Math.min(100, Math.max(0, fillPct)).toFixed(2)),
          temperature:      parseFloat((10 + Math.random() * 15).toFixed(1)),
          batterie:         Math.round(Math.max(10, 70 + Math.random() * 30)),
          signal_force:     null,
        };
      case 'TEMPERATURE':
        return {
          taux_remplissage: parseFloat(Math.min(100, Math.max(0, fillPct)).toFixed(2)),
          temperature:      parseFloat((10 + Math.random() * 15).toFixed(1)),
          batterie:         Math.round(Math.max(10, 70 + Math.random() * 30)),
          signal_force:     null,
        };
      case 'SIGNAL':
        return {
          taux_remplissage: parseFloat(Math.min(100, Math.max(0, fillPct)).toFixed(2)),
          temperature:      null,
          batterie:         Math.round(Math.max(10, 70 + Math.random() * 30)),
          signal_force:     -100 + Math.floor(Math.random() * 45),
        };
      default:
        return {
          taux_remplissage: parseFloat(fillPct.toFixed(2)),
          temperature:      null,
          batterie:         null,
          signal_force:     null,
        };
    }
  }

  // ─── Single container measurement ──────────────────────────────────────────

  async measureContainer(containerId) {
    const state = this.containerState.get(containerId);
    if (!state) return 0;

    const newFill = this.generateFillProgression(state.currentFill);
    state.currentFill = newFill;

    const capteurs = this.capteurMap.get(containerId) || [];

    // If no registered capteurs, send one anonymous measurement
    if (capteurs.length === 0) {
      const readings = this.readingsForCapteur('REMPLISSAGE', newFill);
      await containerClient.recordMeasurement(containerId, readings);
      this.stats.totalMeasurements += 1;
      return 1;
    }

    let sent = 0;
    for (const capteur of capteurs) {
      if (capteur.statut === 'INACTIF') continue;

      const readings = this.readingsForCapteur(capteur.type, newFill);
      const payload = { ...readings, id_capteur: capteur.id };

      // Remove null fields to avoid validation errors
      Object.keys(payload).forEach(k => payload[k] === null && delete payload[k]);

      const result = await containerClient.recordMeasurement(containerId, payload);
      if (result.success) {
        this.stats.totalMeasurements += 1;
        sent += 1;
      }
    }

    // Alert if fill > 80% and we haven't spammed alerts
    if (newFill > 80 && state.alertsSent < 3) {
      await this.publishAlert(containerId, newFill);
      state.alertsSent += 1;
    }
    if (newFill < 50) state.alertsSent = 0;

    return sent;
  }

  // ─── Batch: process ALL containers in parallel chunks ─────────────────────

  async executeBatch() {
    const containerIds = Array.from(this.containerState.keys());
    let totalMeasurements = 0;
    let alertsThisBatch = 0;
    const prevAlertCount = this.stats.alertsTriggered;

    // Process in chunks of CHUNK_SIZE to avoid overwhelming the network
    for (let i = 0; i < containerIds.length; i += CHUNK_SIZE) {
      const chunk = containerIds.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(chunk.map(id => this.measureContainer(id)));
      for (const r of results) {
        if (r.status === 'fulfilled') totalMeasurements += r.value;
      }
    }

    alertsThisBatch = this.stats.alertsTriggered - prevAlertCount;
    this.stats.lastBatchAt = new Date();
    this.stats.lastBatchCount = totalMeasurements;

    const ts = new Date().toLocaleTimeString();
    console.log(
      `[${ts}] 📊 Batch: ${containerIds.length} containers | ` +
      `${totalMeasurements} mesures | ⚠️ ${alertsThisBatch} alertes | ` +
      `Total: ${this.stats.totalMeasurements}`
    );
  }

  // ─── RabbitMQ alert ────────────────────────────────────────────────────────

  async publishAlert(containerId, fillLevel) {
    console.log(`   🚨 ALERT: container ${containerId.substring(0, 8)} → ${fillLevel.toFixed(1)}%`);
    this.stats.alertsTriggered += 1;

    try {
      await Promise.all([
        EventService.publishEvent('container.maintenance_needed', {
          id_conteneur: containerId,
          taux_remplissage: fillLevel,
          timestamp: new Date(),
          alert_type: 'HIGH_FILL_LEVEL',
          reason: 'High fill level detected by IoT sensor',
        }),
        EventService.publishEvent('measurement.alert', {
          id_conteneur: containerId,
          taux_remplissage: fillLevel,
          timestamp: new Date(),
          alert_type: 'HIGH_FILL_LEVEL',
        }),
      ]);
    } catch (err) {
      console.warn(`   ⚠️ RabbitMQ alert publish failed: ${err.message}`);
    }
  }

  // ─── Start / Stop ──────────────────────────────────────────────────────────

  async start() {
    if (this.isRunning) {
      console.log('⚠️ IoT Simulator already running');
      return;
    }

    await this.initialize();
    this.stats.startTime = new Date();

    // First batch immediately, then every 30 s
    await this.executeBatch();

    this.job = schedule.scheduleJob('*/30 * * * * *', async () => {
      await this.executeBatch();
    });

    // Refresh containers & capteurs every 5 min to pick up newly created ones
    this.refreshJob = schedule.scheduleJob('*/5 * * *', async () => {
      try {
        const [containers, capteurMap] = await Promise.all([
          containerClient.getContainers(),
          containerClient.getCapteurs(),
        ]);
        this.capteurMap = capteurMap;
        let added = 0;
        for (const c of containers) {
          if (!this.containerState.has(c.id)) {
            this.containerState.set(c.id, { currentFill: 10 + Math.random() * 40, alertsSent: 0 });
            added++;
          }
        }
        if (added > 0) console.log(`🔄 IoT Simulator: ${added} new container(s) detected, now tracking ${this.containerState.size}`);
      } catch {}
    });

    this.isRunning = true;

    const total = Array.from(this.capteurMap.values()).reduce((s, a) => s + a.length, 0);
    console.log('\n✅ IoT Simulator started');
    console.log(`   📦 ${this.containerState.size} containers | ${total} capteurs IoT`);
    console.log('   ⏱  Running every 30 seconds — full coverage each batch\n');
  }

  stop() {
    if (this.job) {
      this.job.cancel();
      this.isRunning = false;
      console.log('⏹ IoT Simulator stopped');
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats() {
    const uptimeMs = this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0;
    const uptimeMin = Math.floor(uptimeMs / 60000);
    const capteurCount = Array.from(this.capteurMap.values()).reduce((s, a) => s + a.length, 0);

    return {
      isRunning:                   this.isRunning,
      containersCovered:           this.containerState.size,
      capteursRegistered:          capteurCount,
      totalMeasurements:           this.stats.totalMeasurements,
      alertsTriggered:             this.stats.alertsTriggered,
      uptime:                      `${uptimeMin} minutes`,
      startTime:                   this.stats.startTime,
      lastBatchAt:                 this.stats.lastBatchAt,
      lastBatchMeasurements:       this.stats.lastBatchCount,
      avgMeasurementsPerMinute:    uptimeMin > 0 ? Math.floor(this.stats.totalMeasurements / uptimeMin) : 0,
    };
  }
}

module.exports = IoTMeasurementSimulator;
