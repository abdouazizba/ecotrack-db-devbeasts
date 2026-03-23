const HashService = require('../../src/services/HashService');

//Tests the password hashing utility in isolation (no database)-Aziz

describe('HashService - Unit Tests', () => {
  
  describe('hash() method', () => {
    
    test('should hash a password and return different string', () => {
      const password = 'mySecurePassword123';
      const hash = HashService.hash(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
    });

    test('should return bcrypt hash with proper length', () => {
      const password = 'test123';
      const hash = HashService.hash(password);
      
      // Bcrypt hashes are 60 characters
      expect(hash.length).toBe(60);
    });

    test('should return different hash for same password on multiple calls', () => {
      const password = 'samePassword';
      const hash1 = HashService.hash(password);
      const hash2 = HashService.hash(password);
      
      expect(hash1).not.toBe(hash2);
    });

  });

  describe('compare() method', () => {
    
    test('should validate correct password', () => {
      const password = 'correctPassword';
      const hash = HashService.hash(password);
      
      const isValid = HashService.compare(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = HashService.hash(password);
      
      const isValid = HashService.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test('should handle empty password comparison', () => {
      const hash = HashService.hash('somePassword');
      
      const isValid = HashService.compare('', hash);
      expect(isValid).toBe(false);
    });

  });

});
