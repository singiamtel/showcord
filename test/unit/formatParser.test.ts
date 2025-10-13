import { describe, it, expect } from 'vitest';
import formatParser, { parseFormatBitmask } from '@/client/formatParser';

describe('Format Parser', () => {
    describe('parseFormatBitmask', () => {
        it('should parse team flag', () => {
            const settings = parseFormatBitmask(0x1);
            expect(settings.team).toBe(true);
        });

        it('should parse searchShow flag', () => {
            const settings = parseFormatBitmask(0x2);
            expect(settings.searchShow).toBe(true);
        });

        it('should parse challengeShow flag', () => {
            const settings = parseFormatBitmask(0x4);
            expect(settings.challengeShow).toBe(true);
        });

        it('should parse tournamentShow flag', () => {
            const settings = parseFormatBitmask(0x8);
            expect(settings.tournamentShow).toBe(true);
        });

        it('should parse bestOfDefault flag', () => {
            const settings = parseFormatBitmask(0x40);
            expect(settings.bestOfDefault).toBe(true);
        });

        it('should parse multiple flags', () => {
            const settings = parseFormatBitmask(0xf);
            expect(settings.team).toBe(true);
            expect(settings.searchShow).toBe(true);
            expect(settings.challengeShow).toBe(true);
            expect(settings.tournamentShow).toBe(true);
        });

        it('should return false for all flags when bitmask is 0', () => {
            const settings = parseFormatBitmask(0);
            expect(settings.team).toBe(false);
            expect(settings.searchShow).toBe(false);
            expect(settings.challengeShow).toBe(false);
            expect(settings.tournamentShow).toBe(false);
            expect(settings.bestOfDefault).toBe(false);
        });
    });

    describe('formatParser', () => {
        it('should parse simple format list', () => {
            const formats = [
                ',1',
                'S/V Singles',
                '[Gen 9] Random Battle,f',
                ',1',
                'Next Category',
            ];
            const result = formatParser(formats);
            
            expect(result.categories).toHaveLength(2);
            expect(result.categories[0].name).toBe('');
            expect(result.categories[1].name).toBe('S/V Singles');
            expect(result.categories[1].column).toBe(1);
            expect(result.categories[0].formats).toHaveLength(1);
            expect(result.categories[0].formats[0].name).toBe('Random Battle');
            expect(result.categories[0].formats[0].gen).toBe('9');
        });

        it('should parse multiple categories', () => {
            const formats = [
                ',1',
                'Category 1',
                '[Gen 9] Format 1,e',
                ',2',
                'Category 2',
                '[Gen 8] Format 2,c',
                ',1',
                'End',
            ];
            const result = formatParser(formats);
            
            expect(result.categories).toHaveLength(3);
            expect(result.categories[1].name).toBe('Category 1');
            expect(result.categories[0].column).toBe(1);
            expect(result.categories[2].name).toBe('Category 2');
            expect(result.categories[1].column).toBe(2);
        });

        it('should parse multiple formats in one category', () => {
            const formats = [
                ',1',
                'Singles',
                '[Gen 9] OU,e',
                '[Gen 9] Ubers,e',
                '[Gen 9] UU,e',
                ',1',
                'End',
            ];
            const result = formatParser(formats);
            
            expect(result.categories[0].formats).toHaveLength(3);
            expect(result.categories[0].formats[0].name).toBe('OU');
            expect(result.categories[0].formats[1].name).toBe('Ubers');
            expect(result.categories[0].formats[2].name).toBe('UU');
        });

        it('should generate correct IDs', () => {
            const formats = [
                ',1',
                'Singles',
                '[Gen 9] Random Battle,f',
                ',1',
                'End',
            ];
            const result = formatParser(formats);
            
            expect(result.categories[0].formats[0].ID).toBe('gen9randombattle');
        });

        it('should parse format settings from bitmask', () => {
            const formats = [
                ',1',
                'Test',
                '[Gen 9] Format,f',
                ',1',
                'End',
            ];
            const result = formatParser(formats);
            
            expect(result.categories[0].formats[0].settings.searchShow).toBe(true);
            expect(result.categories[0].formats[0].settings.challengeShow).toBe(true);
            expect(result.categories[0].formats[0].settings.tournamentShow).toBe(true);
            expect(result.categories[0].formats[0].settings.team).toBe(true);
        });

        it('should handle formats with spaces in names', () => {
            const formats = [
                ',1',
                'Category',
                '[Gen 9] Random Doubles Battle,f',
                ',1',
                'End',
            ];
            const result = formatParser(formats);
            
            expect(result.categories[0].formats[0].name).toBe('Random Doubles Battle');
            expect(result.categories[0].formats[0].ID).toBe('gen9randomdoublesbattle');
        });

        it('should skip ,LL lines', () => {
            const formats = [
                ',LL',
                ',1',
                'Test',
                '[Gen 9] Format,c',
                ',1',
                'End',
            ];
            const result = formatParser(formats);
            
            expect(result.categories).toHaveLength(2);
        });

        it('should throw error for unknown format', () => {
            const formats = [
                ',1',
                'Test',
                '[Gen 9] Valid,c',
                'Invalid Format',
            ];
            
            expect(() => formatParser(formats)).toThrow('Unknown format: Invalid Format');
        });

        it('should handle real-world format data', () => {
            const formats = [
                ',1',
                'S/V Singles',
                '[Gen 9] Random Battle,f',
                '[Gen 9] Unrated Random Battle,b',
                '[Gen 9] OU,e',
                ',1',
                'S/V Doubles',
                '[Gen 9] Random Doubles Battle,f',
                '[Gen 9] Doubles OU,e',
                ',1',
                'End',
            ];
            const result = formatParser(formats);
            
            expect(result.categories).toHaveLength(3);
            expect(result.categories[1].name).toBe('S/V Singles');
            expect(result.categories[0].formats).toHaveLength(3);
            expect(result.categories[2].name).toBe('S/V Doubles');
            expect(result.categories[1].formats.length + result.categories[0].formats.length).toBeGreaterThanOrEqual(3);
        });
    });
});
