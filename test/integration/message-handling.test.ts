import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client, useMessageStore } from '@/client/client';
import { createClientHarness, type ClientHarness } from '../harness/clientHarness';

describe('Message Handling Integration Tests', () => {
    let harness: ClientHarness;
    let mockWebSocket: ClientHarness['webSocket'];
    let mockServer: ClientHarness['server'];
    let client: Client;

    beforeEach(() => {
        harness = createClientHarness();
        mockWebSocket = harness.webSocket;
        mockServer = harness.server;
        client = harness.client;
        mockServer.joinRoom('testroom', 'chat');
    });

    afterEach(() => {
        harness.cleanup();
    });

    function getMessages(roomID: string) {
        return useMessageStore.getState().rooms[roomID]?.messages ?? [];
    }

    describe('Message Content Parsing', () => {
        it('should parse /raw messages', () => {
            mockServer.sendChat('testroom', 'server', '/raw <b>Bold HTML</b>', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('rawHTML');
            expect(lastMessage?.content).toBe('<b>Bold HTML</b>');
        });

        it('should parse /uhtml messages in chat', () => {
            mockServer.sendChat('testroom', 'server', '/uhtml testbox,<div>Test Content</div>', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('boxedHTML');
            expect(lastMessage?.name).toBe('testbox');
            expect(lastMessage?.content).toBe('<div>Test Content</div>');
        });

        it('should parse /uhtmlchange messages in chat', () => {
            mockServer.sendChat('testroom', 'server', '/uhtml box1,<div>Original</div>', '1234567890');
            mockServer.sendChat('testroom', 'server', '/uhtmlchange box1,<div>Updated</div>', '1234567891');

            const messages = getMessages('testroom');
            const boxMessage = messages.find((m: any) => m.name === 'box1');
            expect(boxMessage?.content).toBe('<div>Updated</div>');
        });

        it('should parse /error messages', () => {
            mockServer.sendChat('testroom', 'server', '/error You cannot do that', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('error');
            expect(lastMessage?.content).toBe('You cannot do that');
        });

        it('should parse /announce messages', () => {
            mockServer.sendChat('testroom', 'server', '/announce Important announcement!', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('announce');
            expect(lastMessage?.content).toBe('Important announcement!');
        });

        it('should parse /log messages', () => {
            mockServer.sendChat('testroom', 'server', '/log Some log message', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('log');
        });

        it('should parse /me roleplay messages', () => {
            mockServer.sendChat('testroom', 'testuser', '/me does something', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('roleplay');
            expect(lastMessage?.content).toBe('does something');
        });

        it('should handle regular chat messages', () => {
            mockServer.sendChat('testroom', 'testuser', 'Hello everyone!', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('chat');
            expect(lastMessage?.user).toBe('testuser');
            expect(lastMessage?.content).toBe('Hello everyone!');
        });
    });

    describe('Special Message Types', () => {
        it('should handle empty line messages', () => {
            mockWebSocket.triggerMessage('>testroom\n|\nSome text');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('log');
            expect(lastMessage?.content).toBe('Some text');
        });

        it('should handle multiple messages in one chunk', () => {
            const chunk = '>testroom\n|c:|1234567890|user1|First message\n|c:|1234567891|user2|Second message';
            mockWebSocket.triggerMessage(chunk);

            const messages = getMessages('testroom');
            expect(messages.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('PM Message Handling', () => {
        beforeEach(() => {
            mockServer.updateUser('myuser', '1', 'lucas');
        });

        it('should handle incoming PM', () => {
            mockServer.sendPM('sender', 'myuser', 'Private message');

            const pmRoom = client.room('pm-sender');
            expect(pmRoom).toBeDefined();

            const messages = getMessages('pm-sender');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.user).toBe('sender');
            expect(lastMessage?.content).toBe('Private message');
        });

        it('should handle outgoing PM', () => {
            mockServer.sendPM('myuser', 'receiver', 'My reply');

            const pmRoom = client.room('pm-receiver');
            expect(pmRoom).toBeDefined();

            const messages = getMessages('pm-receiver');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.user).toBe('myuser');
        });

        it('should handle PM with /challenge', () => {
            mockServer.sendPM('challenger', 'myuser', '/challenge gen9ou');

            const messages = getMessages('pm-challenger');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('challenge');
        });

        it('should handle challenge cancellation', () => {
            mockServer.sendPM('challenger', 'myuser', '/challenge gen9ou');
            mockServer.sendPM('challenger', 'myuser', '/challenge ');

            const pmRoom = client.room('pm-challenger');
            expect(pmRoom).toBeDefined();
        });
    });

    describe('HTML Content Messages', () => {
        it('should handle |html| message', () => {
            mockServer.sendHTML('testroom', '<div class="broadcast">Announcement</div>');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('boxedHTML');
            expect(lastMessage?.content).toContain('Announcement');
        });

        it('should handle |pagehtml| message', () => {
            mockServer.sendRaw('testroom', '<html><body>Full page</body></html>');

            const room = client.room('testroom');
            expect(room).toBeDefined();
        });
    });

    describe('Message Events', () => {
        it('should add message to zustand store on new message', async () => {
            const initialMessages = getMessages('testroom');
            const initialCount = initialMessages.length;

            mockServer.send('>testroom\n|c:|1234567890|TestUser|Test message');
            await new Promise(resolve => setTimeout(resolve, 50));

            const messages = getMessages('testroom');
            expect(messages.length).toBe(initialCount + 1);
        });

        it('should add uhtml message to store', () => {
            const initialCount = getMessages('testroom').length;

            mockServer.sendUHTML('testroom', 'testbox', '<div>Content</div>');

            const messages = getMessages('testroom');
            expect(messages.length).toBeGreaterThan(initialCount);
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.type).toBe('boxedHTML');
            expect(lastMessage?.content).toContain('Content');
        });
    });

    describe('Username Rendering', () => {
        it('should handle usernames with ranks', () => {
            mockServer.sendChat('testroom', '+VoicedUser', 'I have voice', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.user).toBe('+VoicedUser');
        });

        it('should handle usernames with special characters', () => {
            mockServer.sendChat('testroom', 'User_123', 'Hello!', '1234567890');

            const messages = getMessages('testroom');
            const lastMessage = messages[messages.length - 1];
            expect(lastMessage?.user).toBe('User_123');
        });
    });
});
