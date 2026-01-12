import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkRateLimit,
  checkFormTime,
  generateJSToken,
  validateJSToken,
  initFormTimer,
} from './form-protection';

describe('form-protection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });


  describe('checkRateLimit', () => {
    it('should allow first submission', () => {
      const result = checkRateLimit();
      expect(result.allowed).toBe(true);
    });

    it('should allow multiple submissions within limit', () => {
      // Simulate 4 submissions
      for (let i = 0; i < 4; i++) {
        const result = checkRateLimit();
        expect(result.allowed).toBe(true);
        // Advance time by 1 minute
        vi.advanceTimersByTime(60 * 1000);
      }
    });

    it('should block after max submissions', () => {
      // Simulate 6 submissions (over limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit();
        vi.advanceTimersByTime(60 * 1000);
      }

      const result = checkRateLimit();
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Слишком много');
    });

    it('should reset after window expires', () => {
      // Fill up to limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit();
        vi.advanceTimersByTime(60 * 1000);
      }

      // Advance time beyond window (1 hour + 1 minute)
      vi.advanceTimersByTime(61 * 60 * 1000);

      const result = checkRateLimit();
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkFormTime', () => {
    it('should reject form filled too quickly', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(1000); // Only 1 second

      const result = checkFormTime(startTime);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('слишком быстро');
    });

    it('should accept form filled with sufficient time', () => {
      const startTime = Date.now();
      vi.advanceTimersByTime(4000); // 4 seconds

      const result = checkFormTime(startTime);
      expect(result.valid).toBe(true);
    });
  });

  describe('generateJSToken', () => {
    it('should generate unique tokens', () => {
      const token1 = generateJSToken();
      vi.advanceTimersByTime(1);
      const token2 = generateJSToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate token with timestamp', () => {
      const token = generateJSToken();
      const parts = token.split('-');
      expect(parts.length).toBeGreaterThan(1);
      expect(Number.parseInt(parts[0], 10)).toBeGreaterThan(0);
    });
  });

  describe('validateJSToken', () => {
    it('should validate token created after form start', () => {
      const formStartTime = Date.now();
      vi.advanceTimersByTime(1000);
      const token = generateJSToken();

      const result = validateJSToken(token, formStartTime);
      expect(result).toBe(true);
    });

    it('should reject token created before form start', () => {
      const token = generateJSToken();
      vi.advanceTimersByTime(1000);
      const formStartTime = Date.now();

      const result = validateJSToken(token, formStartTime);
      expect(result).toBe(false);
    });

    it('should reject invalid token format', () => {
      const formStartTime = Date.now();
      expect(validateJSToken('invalid', formStartTime)).toBe(false);
      expect(validateJSToken('', formStartTime)).toBe(false);
    });

    it('should reject expired token', () => {
      const formStartTime = Date.now();
      const token = generateJSToken();
      
      // Advance time beyond max age (10 minutes + 1 second)
      vi.advanceTimersByTime(10 * 60 * 1000 + 1000);

      const result = validateJSToken(token, formStartTime);
      expect(result).toBe(false);
    });
  });

  describe('initFormTimer', () => {
    it('should return current timestamp', () => {
      const timer = initFormTimer();
      expect(timer).toBeGreaterThan(0);
      expect(typeof timer).toBe('number');
    });
  });
});
