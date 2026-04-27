import { describe, it, expect } from 'vitest';
import { shouldNotify } from '../../src/client/messageHandling';
import { Room } from '../../src/client/room/room';
import type { Message } from '../../src/client/message';

function createMessage(overrides: Partial<Message> = {}): Message {
    return {
        content: 'test',
        type: 'chat',
        hld: false,
        ...overrides,
    } as Message;
}

describe('shouldNotify', () => {
    it('should not notify for log messages', () => {
        const room = new Room({ ID: 'testroom', name: 'Test Room', type: 'chat', connected: true, open: true });
        const message = createMessage({ type: 'log', hld: true, timestamp: new Date() });
        expect(shouldNotify(room, message, 'otherroom', 'user')).toBe(false);
    });

    it('should notify for highlighted non-log messages', () => {
        const room = new Room({ ID: 'testroom', name: 'Test Room', type: 'chat', connected: true, open: true });
        const message = createMessage({ type: 'chat', hld: true, timestamp: new Date() });
        expect(shouldNotify(room, message, 'otherroom', 'user')).toBe(true);
    });
});
