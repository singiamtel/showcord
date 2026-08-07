import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from '@/client/settings';
import { parseIgnoreCommand } from '@/client/commands/ignoreCommands';

function createSettings(): Settings {
    const settings = new Settings();
    settings.username = 'testuser';
    return settings;
}

function createCallbacks() {
    const messages: { roomID: string; content: string }[] = [];
    return {
        messages,
        callbacks: {
            getSelectedRoom: () => 'lobby',
            addMessageToRoom: vi.fn((roomID: string, message: { content: string }) => {
                messages.push({ roomID, content: message.content });
            }),
        },
    };
}

describe('parseIgnoreCommand', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('ignores unrelated non-command messages', () => {
        const settings = createSettings();
        const { callbacks } = createCallbacks();
        expect(parseIgnoreCommand('hello world', settings, callbacks)).toBe(false);
    });

    it('ignores unrelated commands', () => {
        const settings = createSettings();
        const { callbacks } = createCallbacks();
        expect(parseIgnoreCommand('/join lobby', settings, callbacks)).toBe(false);
    });

    it('adds a user to the ignore list', () => {
        const settings = createSettings();
        const { callbacks, messages } = createCallbacks();
        expect(parseIgnoreCommand('/ignore someuser', settings, callbacks)).toBe(true);
        expect(settings.isIgnored('someuser')).toBe(true);
        expect(messages[0].content).toContain('ignored');
    });

    it('refuses to ignore yourself', () => {
        const settings = createSettings();
        const { callbacks, messages } = createCallbacks();
        parseIgnoreCommand('/ignore testuser', settings, callbacks);
        expect(settings.isIgnored('testuser')).toBe(false);
        expect(messages[0].content).toContain('not able to ignore yourself');
    });

    it('does not double-add an already ignored user', () => {
        const settings = createSettings();
        const { callbacks, messages } = createCallbacks();
        parseIgnoreCommand('/ignore someuser', settings, callbacks);
        parseIgnoreCommand('/ignore someuser', settings, callbacks);
        expect(settings.getIgnoreList()).toEqual(['someuser']);
        expect(messages[1].content).toContain('already on your ignore list');
    });

    it('removes a user via /unignore', () => {
        const settings = createSettings();
        const { callbacks, messages } = createCallbacks();
        parseIgnoreCommand('/ignore someuser', settings, callbacks);
        parseIgnoreCommand('/unignore someuser', settings, callbacks);
        expect(settings.isIgnored('someuser')).toBe(false);
        expect(messages[1].content).toContain('no longer ignored');
    });

    it('reports when unignoring a user not on the list', () => {
        const settings = createSettings();
        const { callbacks, messages } = createCallbacks();
        parseIgnoreCommand('/unignore someuser', settings, callbacks);
        expect(messages[0].content).toContain("isn't on your ignore list");
    });

    it('lists ignored users', () => {
        const settings = createSettings();
        const { callbacks, messages } = createCallbacks();
        parseIgnoreCommand('/ignore alice', settings, callbacks);
        parseIgnoreCommand('/ignore bob', settings, callbacks);
        parseIgnoreCommand('/ignorelist', settings, callbacks);
        expect(messages[2].content).toContain('alice');
        expect(messages[2].content).toContain('bob');
    });

    it('clears the ignore list only after confirmation', () => {
        const settings = createSettings();
        const { callbacks, messages } = createCallbacks();
        parseIgnoreCommand('/ignore alice', settings, callbacks);
        parseIgnoreCommand('/clearignore', settings, callbacks);
        expect(settings.getIgnoreList()).toEqual(['alice']);
        expect(messages[1].content).toContain('confirm');

        parseIgnoreCommand('/clearignore confirm', settings, callbacks);
        expect(settings.getIgnoreList()).toEqual([]);
    });
});
