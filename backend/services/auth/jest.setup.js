// Env vars requis par JwtService au chargement du module
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_jest';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_for_jest';

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
