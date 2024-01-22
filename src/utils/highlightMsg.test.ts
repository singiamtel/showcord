import { test, expect, suite } from 'vitest';
import { stringsToRegex, highlightMsg } from './highlightMsg';


suite('highlightMsg', () => {
    test('should highlight perfect matches', () => {
        const regex = stringsToRegex(['testuser']);
        const msg = 'testuser';
        expect(highlightMsg(regex, msg)).toBe(true);
    });

    test('should highlight names with special characters', () => {
        const regex = stringsToRegex(['TestUser!@*#']);
        const msg = 'hey TestUser!@*#';
        expect(highlightMsg(regex, msg)).toBe(true);
    });

    test('should return false for no match', () => {
        const regex = stringsToRegex(['testuser']);
        const msg = 'help im no good with computers';
        expect(highlightMsg(regex, msg)).toBe(false);
    });

    test('should highlight names with spaces', () => {
        const regex = stringsToRegex(['testuser']);
        const msg = 'hey Test User';
        expect(highlightMsg(regex, msg)).toBe(true);
    });

    test('should parse usernames with spaces correctly', () => {
        const regex = stringsToRegex(['Test User']);
        const msg = 'hey testuser';
        expect(highlightMsg(regex, msg)).toBe(true);
    });

    test('should highlight usernames with punctuation', () => {
        const regex = stringsToRegex(['Test_User']);
        const msg = 'hey Test_User';
        expect(highlightMsg(regex, msg)).toBe(true);
    });

    test('should parse usernames with unicode characters in the middle correctly', () => {
        const regex = stringsToRegex(['its♪zxc']);
        const msg = 'hey its zxc';
        expect(highlightMsg(regex, msg)).toBe(true);
    });

    test('should parse usernames with unicode characters in the end correctly', () => {
        const regex = stringsToRegex(['its zxc♪']);
        const msg = 'hey its zxc';
        expect(highlightMsg(regex, msg)).toBe(true);
    });

    test('should highlight usernames with unicode characters', () => {
        const regex = stringsToRegex(['itszxc']);
        const msg = 'hey its♪zxc';
        expect(highlightMsg(regex, msg)).toBe(true);
    });
});
