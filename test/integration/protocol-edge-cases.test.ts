import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client } from '@/client/client';
import { createMockWebSocket, MockServer } from '../helpers/mockServer';

describe('Protocol Edge Cases', () => {
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
    });

    afterEach(() => {
        global.WebSocket = originalWebSocket;
    });

    describe('Room Edge Cases', () => {
        it('should handle room title update before users list', () => {
            mockServer.joinRoom('test', 'chat');
            mockServer.setRoomTitle('test', 'Test Room');
            mockServer.sendUserList('test', [' user1']);
            
            const room = client.room('test');
            expect(room?.name).toBe('Test Room');
            expect(room?.users.length).toBe(1);
        });

        it('should handle multiple rapid user joins', () => {
            mockServer.joinRoom('lobby', 'chat');
            mockServer.userJoin('lobby', ' user1');
            mockServer.userJoin('lobby', ' user2');
            mockServer.userJoin('lobby', ' user3');
            
            const room = client.room('lobby');
            expect(room?.users.length).toBe(3);
        });

        it('should handle user leave for non-existent user gracefully', () => {
            mockServer.joinRoom('lobby', 'chat');
            mockServer.userLeave('lobby', ' nonexistent');
            
            const room = client.room('lobby');
            expect(room).toBeDefined();
        });

        it('should handle username changes', () => {
            mockServer.joinRoom('lobby', 'chat');
            mockServer.sendUserList('lobby', [' oldname']);
            
            mockWebSocket.triggerMessage('>lobby\n|name|newname|oldname');
            
            const room = client.room('lobby');
            const hasNewUser = room?.users.some(u => u.ID === 'newname');
            expect(hasNewUser).toBe(true);
        });
    });

    describe('Message Edge Cases', () => {
        beforeEach(() => {
            mockServer.joinRoom('testroom', 'chat');
        });

        it('should handle empty messages', () => {
            mockWebSocket.triggerMessage('>testroom\n|c:|1234567890|user|');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.content).toBe('');
        });

        it('should handle messages with pipe characters', () => {
            mockServer.sendChat('testroom', 'user', 'test|message|with|pipes', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.content).toBe('test|message|with|pipes');
        });

        it('should handle very long messages', () => {
            const longMessage = 'a'.repeat(1000);
            mockServer.sendChat('testroom', 'user', longMessage, '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.content).toBe(longMessage);
        });

        it('should handle messages with special characters', () => {
            mockServer.sendChat('testroom', 'user', 'Test 💯 emoji', '1234567890');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.content).toBe('Test 💯 emoji');
        });

        it('should handle consecutive uhtmlchange without uhtml', () => {
            mockServer.sendUHTMLChange('testroom', 'box1', '<div>Changed</div>');
            
            const room = client.room('testroom');
            expect(room).toBeDefined();
        });
    });

    describe('Multi-line Protocol Messages', () => {
        it('should handle chunk with multiple message types', () => {
            const chunk = '>testroom\n|init|chat\n|title|Test\n|users|2, user1, user2\n|c:|1234567890|user1|Hello\n|c:|1234567891|user2|Hi';
            mockWebSocket.triggerMessage(chunk);
            
            const room = client.room('testroom');
            expect(room?.name).toBe('Test');
            expect(room?.users.length).toBe(2);
            expect(room?.messages.length).toBeGreaterThanOrEqual(2);
        });

        it('should handle empty lines in chunks', () => {
            const chunk = '>testroom\n|init|chat\n\n|title|Test\n\n';
            mockWebSocket.triggerMessage(chunk);
            
            const room = client.room('testroom');
            expect(room?.name).toBe('Test');
        });
    });

    describe('Authentication Edge Cases', () => {
        it('should handle updateuser for guest with unusual format', () => {
            mockServer.updateUser(' Guest 999999', '0', 'lucas');
            expect(client.username).toContain('Guest');
        });

        it('should handle rapid updateuser changes', () => {
            mockServer.updateUser('User1', '1', 'lucas');
            mockServer.updateUser('User2', '1', 'lucas');
            mockServer.updateUser('User3', '1', 'lucas');
            
            expect(client.username).toBe('User3');
        });
    });

    describe('PM Edge Cases', () => {
        beforeEach(() => {
            mockServer.updateUser('myuser', '1', 'lucas');
        });

        it('should handle PM to self', () => {
            mockServer.sendPM('myuser', 'myuser', 'Note to self');
            
            const pmRoom = client.room('pm-myuser');
            expect(pmRoom).toBeDefined();
        });

        it('should handle PM with special characters in username', () => {
            mockServer.sendPM('user_123', 'myuser', 'Hello');
            
            const pmRoom = client.room('pm-user123');
            expect(pmRoom).toBeDefined();
        });

        it('should handle multiple consecutive PMs', () => {
            mockServer.sendPM('sender', 'myuser', 'Message 1');
            mockServer.sendPM('sender', 'myuser', 'Message 2');
            mockServer.sendPM('sender', 'myuser', 'Message 3');
            
            const pmRoom = client.room('pm-sender');
            expect(pmRoom?.messages.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Error Handling', () => {
        it('should handle noinit with nonexistent room', () => {
            mockServer.joinRoom('badroom', 'chat');
            mockServer.sendNoInit('badroom', 'nonexistent', 'Room does not exist');
            
            expect(client.room('badroom')).toBeUndefined();
        });

        it('should handle error messages gracefully', () => {
            mockServer.joinRoom('testroom', 'chat');
            mockServer.sendError('testroom', 'Something went wrong');
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('error');
        });
    });

    describe('Formats Parsing', () => {
        it('should parse formats message', () => {
            mockServer.sendFormats([
                ',LL,Formats',
                ',1,S/V Singles',
                '[Gen 9] Random Battle,f',
                '[Gen 9] OU,e',
            ]);
        });

        it('should handle empty formats list', () => {
            mockServer.sendFormats([',LL,Formats']);
        });
    });

    describe('HTML Content Edge Cases', () => {
        beforeEach(() => {
            mockServer.joinRoom('testroom', 'chat');
        });

        it('should handle HTML with script tags', () => {
            mockServer.sendRaw('testroom', '<script>alert("test")</script>');
            
            const room = client.room('testroom');
            expect(room).toBeDefined();
        });

        it('should handle very large HTML content', () => {
            const largeHtml = '<div>' + 'content '.repeat(1000) + '</div>';
            mockServer.sendRaw('testroom', largeHtml);
            
            const room = client.room('testroom');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('rawHTML');
        });

        it('should handle malformed HTML', () => {
            mockServer.sendRaw('testroom', '<div><span>unclosed');
            
            const room = client.room('testroom');
            expect(room).toBeDefined();
        });
    });

    describe('User Status Updates', () => {
        beforeEach(() => {
            mockServer.joinRoom('lobby', 'chat');
        });

        it('should handle users with different ranks', () => {
            mockServer.sendUserList('lobby', [' user', '+voice', '%driver', '@mod', '&leader', '#admin', '~owner']);
            
            const room = client.room('lobby');
            expect(room?.users.length).toBe(7);
        });

        it('should handle user with away status', () => {
            mockServer.sendUserList('lobby', [' user@!']);
            
            const room = client.room('lobby');
            const user = room?.users.find(u => u.ID === 'user');
            expect(user).toBeDefined();
        });
    });
});
