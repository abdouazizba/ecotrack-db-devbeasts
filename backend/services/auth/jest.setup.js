// Mock EventService pour éviter les connexions RabbitMQ pendant les tests
jest.mock('./src/services/EventService', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  publishEvent: jest.fn().mockResolvedValue(true),
  subscribeEvent: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  channel: null,
  connection: null
}));

// Mock process.exit pour éviter que Jest crash si une erreur survient
const originalExit = process.exit;
process.exit = jest.fn();

afterAll(() => {
  process.exit = originalExit;
});
