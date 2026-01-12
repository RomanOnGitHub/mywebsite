import { describe, it, expect } from 'vitest';
import { validateTranslationRequest } from './form-validation';

describe('form-validation', () => {
  describe('validateTranslationRequest', () => {
    it('should validate correct form data', () => {
      const validData = {
        email: 'test@example.com',
        message: 'Please translate this',
        slug: 'my-post',
        collection: 'blog',
        requested_lang: 'en',
      };

      const result = validateTranslationRequest(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        slug: 'my-post',
        collection: 'blog',
        requested_lang: 'en',
      };

      const result = validateTranslationRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.email).toContain('email');
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        // missing slug, collection, requested_lang
      };

      const result = validateTranslationRequest(invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should accept optional message field', () => {
      const validData = {
        email: 'test@example.com',
        slug: 'my-post',
        collection: 'blog',
        requested_lang: 'en',
        // message is optional
      };

      const result = validateTranslationRequest(validData);
      expect(result.success).toBe(true);
    });
  });
});
