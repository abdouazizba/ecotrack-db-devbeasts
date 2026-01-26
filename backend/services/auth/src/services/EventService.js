const amqp = require('amqplib');

class EventService {
  static connection = null;
  static channel = null;

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
          console.error('✗ Failed to initialize EventService after retries:', error.message);
          throw error;
        }
      }
    }
  }

  /**
   * Publish an event to a queue
   * @param {string} eventName - Event name (queue name)
   * @param {object} data - Event data payload
   */
  static async publishEvent(eventName, data) {
    try {
      if (!this.channel) {
        throw new Error('EventService not initialized. Call initialize() first.');
      }

      // Declare queue (idempotent - won't error if exists)
      await this.channel.assertQueue(eventName, { durable: true });

      // Send message
      const message = JSON.stringify(data);
      this.channel.sendToQueue(eventName, Buffer.from(message), { persistent: true });

      console.log(` Event published: ${eventName}`, data);
      return true;
    } catch (error) {
      console.error(` Error publishing event ${eventName}:`, error.message);
      throw error;
    }
  }

  /**
   * Subscribe to an event queue
   * @param {string} eventName - Event name (queue name)
   * @param {function} callback - Handler function(data)
   */
  static async subscribeEvent(eventName, callback) {
    try {
      if (!this.channel) {
        throw new Error('EventService not initialized. Call initialize() first.');
      }

      // Declare queue
      await this.channel.assertQueue(eventName, { durable: true });

      // Set prefetch to 1 (process one message at a time)
      await this.channel.prefetch(1);

      // Consume messages
      await this.channel.consume(eventName, async (msg) => {
        if (msg) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log(` Event received: ${eventName}`, data);

            // Call the callback
            await callback(data);

            // Acknowledge the message
            this.channel.ack(msg);
          } catch (error) {
            console.error(` Error processing event ${eventName}:`, error.message);
            // Nack the message (requeue it)
            this.channel.nack(msg, false, true);
          }
        }
      });

      console.log(`✓ Subscribed to event: ${eventName}`);
    } catch (error) {
      console.error(`✗ Error subscribing to event ${eventName}:`, error.message);
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
