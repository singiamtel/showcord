import { describe, it, expect } from 'vitest';
import { toID, clamp, regex2str, removeFirstCharacterIfNotLetter, omit } from '@/utils/generic';
import { HHMMSS, HHMM } from '@/utils/date';

describe('Generic Utils', () => {
    describe('toID', () => {
        it('should convert string to lowercase ID', () => {
            expect(toID('Test User')).toBe('testuser');
        });

        it('should remove special characters', () => {
            expect(toID('Test@User#123')).toBe('testuser123');
        });

        it('should handle non-string input', () => {
            expect(toID(123)).toBe('');
            expect(toID(null)).toBe('');
            expect(toID(undefined)).toBe('');
        });

        it('should handle empty string', () => {
            expect(toID('')).toBe('');
        });

        it('should preserve numbers', () => {
            expect(toID('User123')).toBe('user123');
        });
    });

    describe('clamp', () => {
        it('should clamp value to minimum', () => {
            expect(clamp(5, 10, 20)).toBe(10);
        });

        it('should clamp value to maximum', () => {
            expect(clamp(25, 10, 20)).toBe(20);
        });

        it('should return value if within range', () => {
            expect(clamp(15, 10, 20)).toBe(15);
        });

        it('should handle negative numbers', () => {
            expect(clamp(-5, -10, 0)).toBe(-5);
            expect(clamp(-15, -10, 0)).toBe(-10);
        });
    });

    describe('regex2str', () => {
        it('should convert regex to string without delimiters', () => {
            const regex = /test/;
            expect(regex2str(regex)).toBe('tes');
        });

        it('should handle regex with flags', () => {
            const regex = /test/gi;
            expect(regex2str(regex)).toBe('test/');
        });

        it('should handle complex patterns', () => {
            const regex = /[a-z0-9]+/;
            expect(regex2str(regex)).toBe('[a-z0-9]');
        });
    });

    describe('removeFirstCharacterIfNotLetter', () => {
        it('should remove first character if not a letter', () => {
            expect(removeFirstCharacterIfNotLetter('+User')).toBe('User');
            expect(removeFirstCharacterIfNotLetter('@Admin')).toBe('Admin');
            expect(removeFirstCharacterIfNotLetter('123Name')).toBe('23Name');
        });

        it('should not remove first character if it is a letter', () => {
            expect(removeFirstCharacterIfNotLetter('User')).toBe('User');
            expect(removeFirstCharacterIfNotLetter('admin')).toBe('admin');
        });

        it('should handle empty string', () => {
            expect(removeFirstCharacterIfNotLetter('')).toBe('');
        });

        it('should handle single non-letter character', () => {
            expect(removeFirstCharacterIfNotLetter('+')).toBe('');
        });
    });

    describe('omit', () => {
        it('should remove specified keys from object', () => {
            const obj = { a: 1, b: 2, c: 3 };
            const result = omit(obj, 'b');
            expect(result).toEqual({ a: 1, c: 3 });
        });

        it('should handle multiple keys', () => {
            const obj = { a: 1, b: 2, c: 3, d: 4 };
            const result = omit(obj, 'b', 'd');
            expect(result).toEqual({ a: 1, c: 3 });
        });

        it('should mutate original object', () => {
            const obj = { a: 1, b: 2, c: 3 };
            omit(obj, 'b');
            expect(obj).toEqual({ a: 1, c: 3 });
        });
    });
});

describe('Date Utils', () => {
    describe('HHMMSS', () => {
        it('should format date as HH:MM:SS', () => {
            const date = new Date('2025-10-13T15:30:45');
            const result = HHMMSS(date);
            expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });

        it('should use 24-hour format', () => {
            const date = new Date('2025-10-13T23:30:45');
            const result = HHMMSS(date);
            expect(result).toContain('23');
        });
    });

    describe('HHMM', () => {
        it('should format date as HH:MM', () => {
            const date = new Date('2025-10-13T15:30:45');
            const result = HHMM(date);
            expect(result).toMatch(/^\d{2}:\d{2}$/);
        });

        it('should truncate seconds', () => {
            const date = new Date('2025-10-13T15:30:45');
            const result = HHMM(date);
            expect(result.length).toBe(5);
        });
    });
});
