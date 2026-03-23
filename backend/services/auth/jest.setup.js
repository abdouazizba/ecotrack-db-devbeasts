// Mock EventService globalement pour éviter les connexions RabbitMQ
jest.mock('./src/services/EventService', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  publishEvent: jest.fn().mockResolvedValue(true),
  subscribeEvent: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  channel: null,
  connection: null
}));

// Mock HashService pour les tests unitaires
jest.mock('./src/services/HashService', () => ({
  hash: jest.fn((password) => {
    // Simule un hash bcrypt
    return '$2a$10$' + Buffer.from(password).toString('base64').slice(0, 45);
  }),
  compare: jest.fn((password, hash) => {
    // Simule une comparaison réussie si le hash contient le password
    return hash.includes(password.slice(0, 5));
  })
}));

// Mock JwtService pour les tests unitaires
jest.mock('./src/services/JwtService', () => ({
  sign: jest.fn((userData, expiresIn = '24h') => {
    // Simule un token JWT simple
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
           Buffer.from(JSON.stringify({ ...userData, exp: Date.now() + 86400000 })).toString('base64') +
           '.mock_signature';
  }),
  verify: jest.fn((token) => {
    if (!token) throw new Error('No token provided');
    if (token === 'invalid') throw new Error('Invalid token');
    if (token === 'expired') throw new Error('Token expired');
    // Parse le token simulé
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    try {
      return JSON.parse(Buffer.from(parts[1], 'base64').toString());
    } catch {
      throw new Error('Invalid token');
    }
  })
}));

// Mock process.exit pour éviter que Jest crash
const originalExit = process.exit;
process.exit = jest.fn();

// Cleanup après les tests
afterAll(() => {
  process.exit = originalExit;
});
