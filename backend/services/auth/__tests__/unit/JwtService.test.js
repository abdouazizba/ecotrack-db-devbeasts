const JwtService = require('../../src/services/JwtService');


//Tests the JWT utility in isolation (no database)-Aziz

describe('JwtService - Unit Tests', () => {
  
  const testUser = {
    id: 1,
    email: 'test@ecotrack.com',
    role: 'AGENT'
  };

  describe('sign() method', () => {
    
    test('should generate valid JWT token', () => {
      const token = JwtService.sign(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should create token with user data in payload', () => {
      const token = JwtService.sign(testUser);
      const decoded = JwtService.verify(token);
      
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    test('should include expiry in token', () => {
      const token = JwtService.sign(testUser);
      const decoded = JwtService.verify(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

  });

  describe('verify() method', () => {
    
    test('should verify valid token', () => {
      const token = JwtService.sign(testUser);
      const decoded = JwtService.verify(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testUser.id);
    });

    test('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        JwtService.verify(invalidToken);
      }).toThrow();
    });

    test('should throw error for expired token', () => {
      const expiredToken = JwtService.sign(testUser, '0s'); // Expires immediately
      
      expect(() => {
        JwtService.verify(expiredToken);
      }).toThrow();
    });

    test('should throw error for tampered token', () => {
      const token = JwtService.sign(testUser);
      const tamperedToken = token.slice(0, -5) + 'XXXXX'; // Modify last 5 chars
      
      expect(() => {
        JwtService.verify(tamperedToken);
      }).toThrow();
    });

  });

});
