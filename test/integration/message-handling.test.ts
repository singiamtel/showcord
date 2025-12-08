import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client } from '@/client/client';
import { createMockWebSocket, MockServer } from '../helpers/mockServer';

describe('Message Handling Integration Tests', () => {
    let mockWebSocket: ReturnType<typeof createMockWebSocket>;
    let mockServer: MockServer;
    let client: Client;
    let originalWebSocket: any;

    beforeEach(() => {
        originalWebSocket = global.WebSocket;
        mockWebSocket = createMockWebSocket();
        
        global.WebSocket = vi.fn(function() { return mockWebSocket; }) as any;
        
        mockServer = new MockServer((data) => {
            mockWebSocket.triggerMessage(data);
        });

        client = new Client({ autoLogin: false, skipVitestCheck: true });
        mockWebSocket.triggerOpen();
        mockServer.joinRoom('testroom', 'chat');
    });

    afterEach(() => {
        global.WebSocket = originalWebSocket;
    });

    describe('Message Content Parsing', () => {
        it('should parse /raw messages', () => {
            mockServer.sendChat('testroom', 'server', '/raw <b>Bold HTML</b>', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('rawHTML');
            expect(lastMessage?.content).toBe('<b>Bold HTML</b>');
        });

        it('should parse /uhtml messages in chat', () => {
            mockServer.sendChat('testroom', 'server', '/uhtml testbox,<div>Test Content</div>', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('boxedHTML');
            expect(lastMessage?.name).toBe('testbox');
            expect(lastMessage?.content).toBe('<div>Test Content</div>');
        });

        it('should parse /uhtmlchange messages in chat', () => {
            mockServer.sendChat('testroom', 'server', '/uhtml box1,<div>Original</div>', '1234567890');
            mockServer.sendChat('testroom', 'server', '/uhtmlchange box1,<div>Updated</div>', '1234567891');
            
            const room = client.room('testroom');
            const boxMessage = room?.messages.find((m: any) => m.name === 'box1');
            expect(boxMessage?.content).toBe('<div>Updated</div>');
        });

        it('should parse /error messages', () => {
            mockServer.sendChat('testroom', 'server', '/error You cannot do that', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('error');
            expect(lastMessage?.content).toBe('You cannot do that');
        });

        it('should parse /announce messages', () => {
            mockServer.sendChat('testroom', 'server', '/announce Important announcement!', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('announce');
            expect(lastMessage?.content).toBe('Important announcement!');
        });

        it('should parse /log messages', () => {
            mockServer.sendChat('testroom', 'server', '/log Some log message', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('log');
        });

        it('should parse /me roleplay messages', () => {
            mockServer.sendChat('testroom', 'testuser', '/me does something', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('roleplay');
            expect(lastMessage?.content).toBe('does something');
        });

        it('should handle regular chat messages', () => {
            mockServer.sendChat('testroom', 'testuser', 'Hello everyone!', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('chat');
            expect(lastMessage?.user).toBe('testuser');
            expect(lastMessage?.content).toBe('Hello everyone!');
        });
    });

    describe('Special Message Types', () => {
        it('should handle empty line messages', () => {
            mockWebSocket.triggerMessage('>testroom\n|\nSome text');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('log');
            expect(lastMessage?.content).toBe('Some text');
        });

        it('should handle multiple messages in one chunk', () => {
            const chunk = '>testroom\n|c:|1234567890|user1|First message\n|c:|1234567891|user2|Second message';
            mockWebSocket.triggerMessage(chunk);
            
            const room = client.room('testroom');
            expect(room?.messages.length).toBeGreaterThanOrEqual(2);
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
            
            const lastMessage = pmRoom?.messages[pmRoom.messages.length - 1];
            expect(lastMessage?.user).toBe('sender');
            expect(lastMessage?.content).toBe('Private message');
        });

        it('should handle outgoing PM', () => {
            mockServer.sendPM('myuser', 'receiver', 'My reply');
            
            const pmRoom = client.room('pm-receiver');
            expect(pmRoom).toBeDefined();
            
            const lastMessage = pmRoom?.messages[pmRoom.messages.length - 1];
            expect(lastMessage?.user).toBe('myuser');
        });

        it('should handle PM with /challenge', () => {
            mockServer.sendPM('challenger', 'myuser', '/challenge gen9ou');
            
            const pmRoom = client.room('pm-challenger');
            const lastMessage = pmRoom?.messages[pmRoom.messages.length - 1];
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
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
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
            const { useMessageStore } = await import('../../src/client/client');
            const initialMessages = useMessageStore.getState().messages['testroom'] || [];
            const initialCount = initialMessages.length;

            mockServer.send('>testroom\n|c:|1234567890|TestUser|Test message');
            await new Promise(resolve => setTimeout(resolve, 50));

            const messages = useMessageStore.getState().messages['testroom'];
            expect(messages.length).toBe(initialCount + 1);
        });

        it('should add uhtml message to room messages', () => {
            const room = client.room('testroom');
            expect(room).toBeDefined();
            const initialCount = room?.messages.length || 0;
            
            mockServer.sendUHTML('testroom', 'testbox', '<div>Content</div>');
            
            expect(room?.messages.length).toBeGreaterThan(initialCount);
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('boxedHTML');
            expect(lastMessage?.content).toContain('Content');
        });
    });

    describe('Username Rendering', () => {
        it('should handle usernames with ranks', () => {
            mockServer.sendChat('testroom', '+VoicedUser', 'I have voice', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.user).toBe('+VoicedUser');
        });

        it('should handle usernames with special characters', () => {
            mockServer.sendChat('testroom', 'User_123', 'Hello!', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.user).toBe('User_123');
        });
    });
});
