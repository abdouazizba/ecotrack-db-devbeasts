const JwtService = require('../../src/services/JwtService');

describe('JwtService - Unit Tests', () => {

  const testUser = { id: 'test-uuid-001', email: 'test@ecotrack.com', role: 'agent' };

  describe('generateAccessToken()', () => {

    test('should generate a valid 3-part JWT string', () => {
      const token = JwtService.generateAccessToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('should embed user data in payload', () => {
      const token = JwtService.generateAccessToken(testUser);
      const decoded = JwtService.decodeToken(token);
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    test('should include iat and exp timestamps', () => {
      const token = JwtService.generateAccessToken(testUser);
      const decoded = JwtService.decodeToken(token);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

  });

  describe('verifyAccessToken()', () => {

    test('should return payload for a valid token', () => {
      const token = JwtService.generateAccessToken(testUser);
      const decoded = JwtService.verifyAccessToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
    });

    test('should return null for a malformed token', () => {
      const result = JwtService.verifyAccessToken('not.a.valid.jwt');
      expect(result).toBeNull();
    });

    test('should return null for a tampered token', () => {
      const token = JwtService.generateAccessToken(testUser);
      const tampered = token.slice(0, -5) + 'XXXXX';
      const result = JwtService.verifyAccessToken(tampered);
      expect(result).toBeNull();
    });

    test('should return null for an empty string', () => {
      const result = JwtService.verifyAccessToken('');
      expect(result).toBeNull();
    });

  });

  describe('decodeToken()', () => {

    test('should decode token without signature verification', () => {
      const token = JwtService.generateAccessToken(testUser);
      const decoded = JwtService.decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded.email).toBe(testUser.email);
    });

  });

});
