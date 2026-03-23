const amqp = require('amqplib');

class EventService {
  static connection = null;
  static channel = null;
  static EXCHANGE_NAME = 'ecotrack_events'; // Central topic exchange for all events

  /**
   * Initialize RabbitMQ connection with retry logic
   */
  static async initialize() {
    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        
        this.connection = await amqp.connect(rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        // Declare the topic exchange (durable for persistence)
        await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });
        console.log(`✓ Topic exchange '${this.EXCHANGE_NAME}' declared`);

        // Graceful shutdown
        process.on('SIGINT', async () => {
          await this.close();
          process.exit(0);
        });

        console.log('✓ EventService connected to RabbitMQ');
        return this.channel;
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          console.warn(`⚠️  RabbitMQ connection attempt ${retries}/${maxRetries} failed. Retrying in 5s...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.warn('⚠️  RabbitMQ unavailable - running in degraded mode (events won\'t be published)');
          this.connection = null;
          this.channel = null;
          return null;
        }
      }
    }
  }

  /**
   * Publish an event to the topic exchange
   * @param {string} routingKey - Routing key (e.g., 'user.created', 'measurement.recorded')
   * @param {object} data - Event data payload
   */
  static async publishEvent(routingKey, data) {
    try {
      if (!this.channel) {
        console.warn(`⚠️  EventService not connected. Skipping event publish: ${routingKey}`);
        return false;
      }

      // Publish to topic exchange with routing key
      const message = JSON.stringify(data);
      this.channel.publish(
        this.EXCHANGE_NAME,
        routingKey,
        Buffer.from(message),
        { persistent: true, contentType: 'application/json' }
      );

      console.log(` Event published: ${routingKey} →`, data);
      return true;
    } catch (error) {
      console.error(`✗ Error publishing event ${routingKey}:`, error.message);
      throw error;
    }
  }

  /**
   * Subscribe to event(s) via routing key pattern
   * @param {string} routingKey - Routing key pattern (e.g., 'user.created', 'measurement.*')
   * @param {string} subscriberName - Unique queue name per subscriber
   * @param {function} callback - Handler function(data)
   */
  static async subscribeEvent(routingKey, subscriberName, callback) {
    try {
      if (!this.channel) {
        throw new Error('EventService not initialized. Call initialize() first.');
      }

      // Declare a unique queue per subscriber (durable)
      const queue = await this.channel.assertQueue(`${subscriberName}_${routingKey}`, {
        durable: true,
        arguments: { 'x-message-ttl': 86400000 } // 24h TTL
      });

      // Bind queue to exchange with routing key pattern
      await this.channel.bindQueue(queue.queue, this.EXCHANGE_NAME, routingKey);
      console.log(`✓ Subscribed to '${routingKey}' (queue: ${queue.queue})`);

      // Set prefetch to 1 (process one message at a time)
      await this.channel.prefetch(1);

      // Consume messages from the queue
      await this.channel.consume(queue.queue, async (msg) => {
        if (msg) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log(`📥 Event received: ${msg.fields.routingKey} →`, data);

            // Call the callback
            await callback(data);

            // Acknowledge the message
            this.channel.ack(msg);
          } catch (error) {
            console.error(`✗ Error processing event ${routingKey}:`, error.message);
            // Nack the message (requeue it)
            this.channel.nack(msg, false, true);
          }
        }
      });
    } catch (error) {
      console.error(`✗ Error subscribing to event ${routingKey}:`, error.message);
      throw error;
    }
  }

  /**
   * Close RabbitMQ connection
   */
  static async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('✓ EventService connection closed');
    } catch (error) {
      console.error('✗ Error closing EventService:', error.message);
    }
  }
}

module.exports = EventService;
