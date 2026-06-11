const { Op } = require('sequelize');
const { Mesure, MesureArchive, sequelize } = require('../models');

const ARCHIVE_AFTER_DAYS = 90;
const BATCH_SIZE = 1000;
const SCHEDULE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

class ArchiveService {
  static async archiveMesures(olderThanDays = ARCHIVE_AFTER_DAYS) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let totalArchived = 0;

    while (true) {
      const rows = await Mesure.findAll({
        where: { date_mesure: { [Op.lt]: cutoff } },
        limit: BATCH_SIZE,
        raw: true,
      });

      if (rows.length === 0) break;

      const now = new Date();
      const archiveRows = rows.map((r) => ({ ...r, archived_at: now }));

      await sequelize.transaction(async (t) => {
        await MesureArchive.bulkCreate(archiveRows, {
          transaction: t,
          ignoreDuplicates: true,
        });
        await Mesure.destroy({
          where: { id: rows.map((r) => r.id) },
          transaction: t,
        });
      });

      totalArchived += rows.length;
      console.log(`[ArchiveService] Archived batch of ${rows.length} mesures (total: ${totalArchived})`);

      if (rows.length < BATCH_SIZE) break;
    }

    if (totalArchived > 0) {
      console.log(`✓ [ArchiveService] Done — ${totalArchived} mesures archived (cutoff: ${cutoff.toISOString()})`);
    }

    return totalArchived;
  }

  static startScheduler() {
    // Delay first run by 30s to avoid memory spike during server startup
    setTimeout(() => {
      this.archiveMesures().catch((err) =>
        console.error('[ArchiveService] Startup archive failed:', err.message)
      );
    }, 30_000);

    setInterval(() => {
      this.archiveMesures().catch((err) =>
        console.error('[ArchiveService] Scheduled archive failed:', err.message)
      );
    }, SCHEDULE_INTERVAL_MS);

    console.log(`✓ [ArchiveService] Scheduler started — archiving mesures older than ${ARCHIVE_AFTER_DAYS} days every 24h`);
  }
}

module.exports = ArchiveService;
