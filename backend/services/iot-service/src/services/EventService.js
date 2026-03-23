const amqp = require('amqplib');

class EventService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchangeName = 'ecotrack_events';
    this.exchangeType = 'topic';
  }

  /**
   * Initialize connection to RabbitMQ
   */
  async initialize() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://ecotrack:ecotrack123@rabbitmq:5672';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, { durable: true });

      console.log('✓ EventService initialized - RabbitMQ connected');
      return true;
    } catch (error) {
      console.error('✗ Failed to initialize EventService:', error.message);
      console.warn('⚠ Running in degraded mode (without event publishing)');
      return false;
    }
  }

  /**
   * Publish measurement event
   * @param {string} eventType - Event type (e.g., 'measurement.recorded', 'measurement.failed')
   * @param {object} data - Event data
   */
  async publishEvent(eventType, data) {
    try {
      if (!this.channel) {
        console.warn('⚠ EventService not connected, event not published:', eventType);
        return false;
      }

      const message = {
        timestamp: new Date().toISOString(),
        type: eventType,
        data
      };

      this.channel.publish(
        this.exchangeName,
        eventType,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      console.log(`📤 Published event: ${eventType}`);
      return true;
    } catch (error) {
      console.error(`Error publishing event ${eventType}:`, error.message);
      return false;
    }
  }

  /**
   * Subscribe to measurement events (for testing/logging)
   * @param {string} routingKey - Routing key pattern (e.g., 'measurement.*')
   * @param {function} handler - Event handler function
   */
  async subscribeEvent(routingKey, handler) {
    try {
      if (!this.channel) {
        console.warn('⚠ EventService not connected, subscription failed');
        return false;
      }

      // Create queue for this subscriber
      const queue = await this.channel.assertQueue(`iot-service-${routingKey}`, { durable: true });

      // Bind queue to exchange
      await this.channel.bindQueue(queue.queue, this.exchangeName, routingKey);

      // Consume messages
      this.channel.consume(queue.queue, (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          handler(content);
          this.channel.ack(msg);
        }
      });

      console.log(`📥 Subscribed to: ${routingKey}`);
      return true;
    } catch (error) {
      console.error(`Error subscribing to ${routingKey}:`, error.message);
      return false;
    }
  }

  /**
   * Close RabbitMQ connection
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('✓ EventService connection closed');
    } catch (error) {
      console.error('Error closing EventService:', error.message);
    }
  }
}

module.exports = new EventService();
