const HashService = require('../../src/services/HashService');

describe('HashService - Unit Tests', () => {

  describe('hashPassword() method', () => {

    test('should hash a password and return a different string', async () => {
      const password = 'MySecure@123';
      const hash = await HashService.hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
    });

    test('should return bcrypt hash with proper length (60 chars)', async () => {
      const hash = await HashService.hashPassword('Test@1234');
      expect(hash.length).toBe(60);
    });

    test('should return different hash for same password (random salt)', async () => {
      const password = 'Same@Pass1';
      const hash1 = await HashService.hashPassword(password);
      const hash2 = await HashService.hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

  });

  describe('comparePassword() method', () => {

    test('should validate correct password', async () => {
      const password = 'Correct@Pass1';
      const hash = await HashService.hashPassword(password);
      const isValid = await HashService.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const hash = await HashService.hashPassword('Correct@Pass1');
      const isValid = await HashService.comparePassword('Wrong@Pass999', hash);
      expect(isValid).toBe(false);
    });

    test('should handle empty password', async () => {
      const hash = await HashService.hashPassword('Some@Pass1');
      const isValid = await HashService.comparePassword('', hash);
      expect(isValid).toBe(false);
    });

  });

});
