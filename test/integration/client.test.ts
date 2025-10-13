import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client, useAppStore } from '@/client/client';
import { createMockWebSocket, MockServer } from '../helpers/mockServer';

describe('Client Integration Tests', () => {
    let mockWebSocket: ReturnType<typeof createMockWebSocket>;
    let mockServer: MockServer;
    let client: Client;
    let originalWebSocket: any;
    let originalVitest: any;

    beforeEach(() => {
        originalWebSocket = global.WebSocket;
        originalVitest = (import.meta as any).env?.VITEST;
        
        mockWebSocket = createMockWebSocket();
        
        global.WebSocket = vi.fn(() => mockWebSocket) as any;
        
        mockServer = new MockServer((data) => {
            mockWebSocket.triggerMessage(data);
        });

        client = new Client({ autoLogin: false, skipVitestCheck: true });
        mockWebSocket.triggerOpen();
    });

    afterEach(() => {
        global.WebSocket = originalWebSocket;
        if ((import.meta as any).env) {
            (import.meta as any).env.VITEST = originalVitest;
        }
    });

    describe('Connection Lifecycle', () => {
        it('should connect to WebSocket on initialization', () => {
            expect(global.WebSocket).toHaveBeenCalled();
        });

        it('should receive and parse challstr', () => {
            mockServer.sendChallstr('test123|456');
            expect(client.isLoggedIn).toBe(false);
        });

        it('should handle socket close event', () => {
            mockWebSocket.triggerClose();
            
            expect(useAppStore.getState().isConnected).toBe(false);
        });
    });

    describe('Room Operations', () => {
        it('should create room on |init| message', () => {
            mockServer.joinRoom('lobby', 'chat');
            
            const room = client.room('lobby');
            expect(room).toBeDefined();
            expect(room?.ID).toBe('lobby');
            expect(room?.type).toBe('chat');
        });

        it('should set room title on |title| message', () => {
            mockServer.joinRoom('lobby', 'chat');
            mockServer.setRoomTitle('lobby', 'Test Lobby');
            
            const room = client.room('lobby');
            expect(room?.name).toBe('Test Lobby');
        });

        it('should add users to room on |users| message', () => {
            mockServer.joinRoom('lobby', 'chat');
            mockServer.sendUserList('lobby', [' user1', '+user2', '@user3']);
            
            const room = client.room('lobby');
            expect(room?.users.length).toBe(3);
        });

        it('should handle user join', () => {
            mockServer.joinRoom('lobby', 'chat');
            mockServer.userJoin('lobby', ' newuser');
            
            const room = client.room('lobby');
            expect(room?.users.some(u => u.ID === 'newuser')).toBe(true);
        });

        it('should handle user leave', () => {
            mockServer.joinRoom('lobby', 'chat');
            mockServer.sendUserList('lobby', [' testuser']);
            mockServer.userLeave('lobby', ' testuser');
            
            const room = client.room('lobby');
            expect(room?.users.some(u => u.ID === 'testuser')).toBe(false);
        });

        it('should remove room on |deinit| message', () => {
            mockServer.joinRoom('testroom', 'chat');
            expect(client.room('testroom')).toBeDefined();
            
            mockServer.deinitRoom('testroom');
            expect(client.room('testroom')).toBeUndefined();
        });

        it('should handle noinit with namerequired', () => {
            mockServer.sendNoInit('secretroom', 'namerequired');
        });

        it('should remove room on noinit with nonexistent', () => {
            mockServer.joinRoom('fakeroom', 'chat');
            mockServer.sendNoInit('fakeroom', 'nonexistent', 'Room does not exist');
            
            expect(client.room('fakeroom')).toBeUndefined();
        });
    });

    describe('Message Handling', () => {
        beforeEach(() => {
            mockServer.joinRoom('lobby', 'chat');
        });

        it('should handle timestamped chat messages', () => {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            mockServer.sendChat('lobby', 'testuser', 'Hello world!', timestamp);
            
            const room = client.room('lobby');
            expect(room?.messages.length).toBeGreaterThan(0);
            
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.user).toBe('testuser');
            expect(lastMessage?.content).toBe('Hello world!');
        });

        it('should handle non-timestamped chat messages', () => {
            mockServer.sendChat('lobby', 'testuser', 'Hello!');
            
            const room = client.room('lobby');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.user).toBe('testuser');
        });

        it('should handle raw HTML messages', () => {
            mockServer.sendRaw('lobby', '<div>Test HTML</div>');
            
            const room = client.room('lobby');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('rawHTML');
            expect(lastMessage?.content).toBe('<div>Test HTML</div>');
        });

        it('should handle error messages', () => {
            mockServer.sendError('lobby', 'Test error message');
            
            const room = client.room('lobby');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.type).toBe('error');
        });

        it('should handle uhtml messages', () => {
            mockServer.sendUHTML('lobby', 'testbox', '<div>Test Box</div>');
            
            const room = client.room('lobby');
            const lastMessage = room?.messages[room.messages.length - 1];
            expect(lastMessage?.name).toBe('testbox');
            expect(lastMessage?.type).toBe('boxedHTML');
        });

        it('should handle uhtmlchange messages', () => {
            mockServer.sendUHTML('lobby', 'testbox', '<div>Original</div>');
            mockServer.sendUHTMLChange('lobby', 'testbox', '<div>Updated</div>');
            
            const room = client.room('lobby');
            const boxMessage = room?.messages.find(m => m.name === 'testbox');
            expect(boxMessage?.content).toBe('<div>Updated</div>');
        });
    });

    describe('Private Messages', () => {
        it('should create PM room on incoming PM', () => {
            mockServer.updateUser('testuser', '1', 'lucas');
            mockServer.sendPM('sender', 'testuser', 'Hey there!');
            
            const pmRoom = client.room('pm-sender');
            expect(pmRoom).toBeDefined();
            expect(pmRoom?.type).toBe('pm');
        });

        it('should route outgoing PM correctly', () => {
            mockServer.updateUser('testuser', '1', 'lucas');
            mockServer.sendPM('testuser', 'receiver', 'Hello!');
            
            const pmRoom = client.room('pm-receiver');
            expect(pmRoom).toBeDefined();
        });
    });

    describe('Authentication', () => {
        it('should handle updateuser for guest', () => {
            mockServer.updateUser(' Guest 12345', '0', 'lucas');
            expect(client.username).toContain('Guest');
        });

        it('should handle updateuser for logged in user', () => {
            mockServer.updateUser('TestUser', '1', 'lucas');
            expect(client.username).toBe('TestUser');
        });

        it('should handle userdetails query response', () => {
            const userDetails = {
                userid: 'testuser',
                name: 'TestUser',
                avatar: 'lucas',
                status: 'online',
            };
            
            const callback = vi.fn();
            client.queryUser('testuser', callback);
            mockServer.sendQueryResponse('userdetails', userDetails);
            
            expect(callback).toHaveBeenCalledWith(userDetails);
        });

        it('should handle rooms query response', () => {
            const roomsData = {
                official: [{ title: 'Lobby', desc: 'Main room' }],
                chat: [],
                userCount: 100,
            };
            
            const callback = vi.fn();
            client.queryRooms(callback);
            mockServer.sendQueryResponse('rooms', roomsData);
            
            expect(callback).toHaveBeenCalledWith(roomsData);
        });
    });

    describe('Formats', () => {
        it('should parse formats list', () => {
            const formats = [
                ',LL,Formats',
                ',1,Random Battle',
                'gen9randombattle,[Gen 9] Random Battle',
            ];
            
            mockServer.sendFormats(formats);
        });
    });

    describe('Permanent Rooms', () => {
        it('should have home room by default', () => {
            const homeRoom = client.room('home');
            expect(homeRoom).toBeDefined();
            expect(homeRoom?.type).toBe('permanent');
        });

        it('should have settings room by default', () => {
            const settingsRoom = client.room('settings');
            expect(settingsRoom).toBeDefined();
            expect(settingsRoom?.type).toBe('permanent');
        });
    });
});
