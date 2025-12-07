import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client } from '@/client/client';
import { createMockWebSocket, MockServer } from '../helpers/mockServer';
import { BattleRoom } from '@/client/room/battleRoom';
import { useRoomStore } from '@/client/stores/roomStore';

describe('Battle Cleanup Integration Tests', () => {
    let mockWebSocket: ReturnType<typeof createMockWebSocket>;
    let mockServer: MockServer;
    let client: Client;
    let originalWebSocket: any;
    let originalConfirm: any;

    beforeEach(() => {
        // Reset the room store between tests
        useRoomStore.setState({
            rooms: new Map(),
            selectedRoomID: 'home',
            currentRoom: undefined,
            battleRequest: undefined,
            usersUpdateCounter: 0,
        });

        originalWebSocket = global.WebSocket;
        mockWebSocket = createMockWebSocket();
        global.WebSocket = vi.fn(() => mockWebSocket) as any;
        
        mockServer = new MockServer((data) => {
            mockWebSocket.triggerMessage(data);
        });

        client = new Client({ autoLogin: false, skipVitestCheck: true });
        mockWebSocket.triggerOpen();
        
        originalConfirm = window.confirm;
        window.confirm = vi.fn(() => true); // Default to yes
    });

    afterEach(() => {
        global.WebSocket = originalWebSocket;
        window.confirm = originalConfirm;
    });

    it('should set isPlayer when user is a player', () => {
        const username = 'TestUser';
        client.settings.username = username; // Force username
        
        mockServer.joinRoom('battle-gen9randombattle-12345', 'battle');
        const room = client.room('battle-gen9randombattle-12345');
        expect(room instanceof BattleRoom).toBe(true);
        expect((room as BattleRoom).isPlayer).toBe(false);

        // Send player message
        // |player|p1|TestUser|avatar| 
        mockServer.send(`>battle-gen9randombattle-12345\n|player|p1|${username}|101`);
        
        expect((room as BattleRoom).isPlayer).toBe(true);
    });

    it('should set battleEnded on win', () => {
        mockServer.joinRoom('battle-test', 'battle');
        const room = client.room('battle-test') as BattleRoom;
        
        mockServer.send(`>battle-test\n|win|TestUser`);
        expect(room.battleEnded).toBe(true);
    });

    it('should set battleEnded on tie', () => {
        mockServer.joinRoom('battle-test', 'battle');
        const room = client.room('battle-test') as BattleRoom;
        
        mockServer.send(`>battle-test\n|tie`);
        expect(room.battleEnded).toBe(true);
    });

    it('should prompt forfeit and send forfeit command when leaving active battle as player', () => {
        const username = 'TestUser';
        client.settings.username = username;
        const roomID = 'battle-active';
        
        mockServer.joinRoom(roomID, 'battle');
        const room = client.room(roomID) as BattleRoom;
        
        // Make user a player
        mockServer.send(`>${roomID}\n|player|p1|${username}|101`);
        
        // Spy on socket send
        const sendSpy = vi.spyOn(mockWebSocket, 'send');
        
        // Attempt to leave
        client.leaveRoom(roomID);
        
        expect(window.confirm).toHaveBeenCalled();
        // Should send /forfeit and /leave
        expect(sendSpy).toHaveBeenCalledWith(`${roomID}|/forfeit`);
        expect(sendSpy).toHaveBeenCalledWith(`|/leave ${roomID}`);
    });

    it('should NOT prompt forfeit if battle ended', () => {
        const username = 'TestUser';
        client.settings.username = username;
        const roomID = 'battle-ended';
        
        mockServer.joinRoom(roomID, 'battle');
        const room = client.room(roomID) as BattleRoom;
        
        mockServer.send(`>${roomID}\n|player|p1|${username}|101`);
        mockServer.send(`>${roomID}\n|win|Someone`);
        
        const sendSpy = vi.spyOn(mockWebSocket, 'send');
        
        client.leaveRoom(roomID);
        
        expect(window.confirm).not.toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith(`|/leave ${roomID}`);
    });

     it('should NOT prompt forfeit if not a player (spectator)', () => {
        const username = 'TestUser';
        client.settings.username = username;
        const roomID = 'battle-spectator';
        
        mockServer.joinRoom(roomID, 'battle');
        // Player message for someone else
        mockServer.send(`>${roomID}\n|player|p1|OthersUser|101`);
        
        const sendSpy = vi.spyOn(mockWebSocket, 'send');
        
        client.leaveRoom(roomID);
        
        expect(window.confirm).not.toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalledWith(`|/leave ${roomID}`);
    });

    describe('Page unload cleanup', () => {
        it('should return active battle rooms where user is a player', () => {
            const username = 'TestUser';
            client.settings.username = username;
            
            // Create an active battle where user is a player
            mockServer.joinRoom('battle-active-1', 'battle');
            mockServer.send(`>battle-active-1\n|player|p1|${username}|101`);
            
            // Create a battle where user is spectator
            mockServer.joinRoom('battle-spectating', 'battle');
            mockServer.send(`>battle-spectating\n|player|p1|OtherUser|101`);
            
            // Create an ended battle where user was a player
            mockServer.joinRoom('battle-ended', 'battle');
            mockServer.send(`>battle-ended\n|player|p1|${username}|101`);
            mockServer.send(`>battle-ended\n|win|Someone`);
            
            const activeBattles = client.getActiveBattleRooms();
            
            // Debug: check the state of each battle room
            const activeRoom = client.room('battle-active-1') as BattleRoom;
            const spectatingRoom = client.room('battle-spectating') as BattleRoom;
            const endedRoom = client.room('battle-ended') as BattleRoom;
            
            expect(activeRoom.isPlayer).toBe(true);
            expect(activeRoom.battleEnded).toBe(false);
            expect(spectatingRoom.isPlayer).toBe(false);
            expect(endedRoom.isPlayer).toBe(true);
            expect(endedRoom.battleEnded).toBe(true);
            
            expect(activeBattles).toHaveLength(1);
            expect(activeBattles[0].ID).toBe('battle-active-1');
        });

        it('should send /leave for all active battles on leaveAllActiveBattles', () => {
            const username = 'TestUser';
            client.settings.username = username;
            
            // Create multiple active battles
            mockServer.joinRoom('battle-active-1', 'battle');
            mockServer.send(`>battle-active-1\n|player|p1|${username}|101`);
            
            mockServer.joinRoom('battle-active-2', 'battle');
            mockServer.send(`>battle-active-2\n|player|p2|${username}|101`);
            
            const sendSpy = vi.spyOn(mockWebSocket, 'send');
            
            client.leaveAllActiveBattles();
            
            expect(sendSpy).toHaveBeenCalledWith('battle-active-1|/leave');
            expect(sendSpy).toHaveBeenCalledWith('battle-active-2|/leave');
        });

        it('should not send /leave for spectated or ended battles on leaveAllActiveBattles', () => {
            const username = 'TestUser';
            client.settings.username = username;
            
            // Spectated battle
            mockServer.joinRoom('battle-spectating', 'battle');
            mockServer.send(`>battle-spectating\n|player|p1|OtherUser|101`);
            
            // Ended battle
            mockServer.joinRoom('battle-ended', 'battle');
            mockServer.send(`>battle-ended\n|player|p1|${username}|101`);
            mockServer.send(`>battle-ended\n|win|Someone`);
            
            const sendSpy = vi.spyOn(mockWebSocket, 'send');
            
            client.leaveAllActiveBattles();
            
            expect(sendSpy).not.toHaveBeenCalled();
        });

        it('should call leaveAllActiveBattles on beforeunload event', () => {
            const username = 'TestUser';
            client.settings.username = username;
            
            mockServer.joinRoom('battle-active', 'battle');
            mockServer.send(`>battle-active\n|player|p1|${username}|101`);
            
            const sendSpy = vi.spyOn(mockWebSocket, 'send');
            
            // Simulate beforeunload event
            const event = new Event('beforeunload');
            window.dispatchEvent(event);
            
            expect(sendSpy).toHaveBeenCalledWith('battle-active|/leave');
        });
    });
});
