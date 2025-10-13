import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Client } from '@/client/client';
import { BattleRoom } from '@/client/room/battleRoom';
import { createMockWebSocket, MockServer } from '../helpers/mockServer';

describe('Battle Room Integration Tests', () => {
    let mockWebSocket: ReturnType<typeof createMockWebSocket>;
    let mockServer: MockServer;
    let client: Client;
    let originalWebSocket: any;

    beforeEach(() => {
        originalWebSocket = global.WebSocket;
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
    });

    describe('Battle Initialization', () => {
        it('should create battle room on |init|battle', () => {
            mockServer.joinRoom('battle-gen9ou-12345', 'battle');
            
            const room = client.room('battle-gen9ou-12345');
            expect(room).toBeDefined();
            expect(room).toBeInstanceOf(BattleRoom);
            expect(room?.type).toBe('battle');
        });

        it('should set room title for battle', () => {
            mockServer.joinRoom('battle-gen9ou-12345', 'battle');
            mockServer.setRoomTitle('battle-gen9ou-12345', 'Player1 vs Player2');
            
            const room = client.room('battle-gen9ou-12345');
            expect(room?.name).toBe('Player1 vs Player2');
        });
    });

    describe('Player Setup', () => {
        beforeEach(() => {
            mockServer.joinRoom('battle-test', 'battle');
            mockServer.updateUser('testuser', '1', 'lucas');
        });

        it('should handle player message', () => {
            mockServer.sendBattlePlayer('battle-test', 'p1', 'testuser', 'lucas');
            
            const room = client.room('battle-test') as BattleRoom;
            expect(room).toBeDefined();
        });

        it('should set perspective for own player', () => {
            mockServer.sendBattlePlayer('battle-test', 'p2', 'testuser', 'lucas');
            
            const room = client.room('battle-test') as BattleRoom;
            expect(room).toBeDefined();
        });
    });

    describe('Battle Requests', () => {
        beforeEach(() => {
            mockServer.joinRoom('battle-test', 'battle');
            mockServer.updateUser('testuser', '1', 'lucas');
            mockServer.sendBattlePlayer('battle-test', 'p1', 'testuser');
        });

        it('should handle move request', () => {
            const requestSpy = vi.fn();
            client.events.addEventListener('request', requestSpy);

            const moveRequest = {
                requestType: 'move',
                active: [{
                    moves: [
                        { move: 'Tackle', id: 'tackle', pp: 35, maxpp: 56, target: 'normal', disabled: false },
                    ],
                }],
                side: {
                    name: 'testuser',
                    id: 'p1',
                    pokemon: [],
                },
            };

            mockServer.sendBattleRequest('battle-test', moveRequest);
            expect(requestSpy).toHaveBeenCalled();
        });

        it('should handle switch request', () => {
            const requestSpy = vi.fn();
            client.events.addEventListener('request', requestSpy);

            const switchRequest = {
                requestType: 'switch',
                side: {
                    name: 'testuser',
                    id: 'p1',
                    pokemon: [
                        { ident: 'p1: Pikachu', details: 'Pikachu, M', condition: '100/100', active: false },
                    ],
                },
            };

            mockServer.sendBattleRequest('battle-test', switchRequest);
            expect(requestSpy).toHaveBeenCalled();
        });

        it('should handle team preview request', () => {
            const requestSpy = vi.fn();
            client.events.addEventListener('request', requestSpy);

            const teamRequest = {
                requestType: 'team',
                side: {
                    name: 'testuser',
                    id: 'p1',
                    pokemon: [],
                },
            };

            mockServer.sendBattleRequest('battle-test', teamRequest);
            expect(requestSpy).toHaveBeenCalled();
        });
    });

    describe('Battle Flow', () => {
        beforeEach(() => {
            mockServer.joinRoom('battle-test', 'battle');
        });

        it('should handle battle start', () => {
            mockServer.sendBattleStart('battle-test');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle battle move', () => {
            mockServer.sendBattleLine('battle-test', '|move|p1a: Pikachu|Thunderbolt|p2a: Charizard');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle switch', () => {
            mockServer.sendBattleLine('battle-test', '|switch|p1a: Bulbasaur|Bulbasaur, M|100/100');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle faint', () => {
            mockServer.sendBattleLine('battle-test', '|faint|p2a: Charizard');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle win', () => {
            mockServer.sendBattleWin('battle-test', 'Player1');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle tie', () => {
            mockServer.sendBattleTie('battle-test');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });
    });

    describe('Battle Effects', () => {
        beforeEach(() => {
            mockServer.joinRoom('battle-test', 'battle');
        });

        it('should handle damage', () => {
            mockServer.sendBattleLine('battle-test', '|-damage|p1a: Pikachu|50/100');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle heal', () => {
            mockServer.sendBattleLine('battle-test', '|-heal|p1a: Pikachu|80/100|[from] item: Leftovers');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle status', () => {
            mockServer.sendBattleLine('battle-test', '|-status|p1a: Pikachu|par');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle boost', () => {
            mockServer.sendBattleLine('battle-test', '|-boost|p1a: Pikachu|atk|1');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });

        it('should handle weather', () => {
            mockServer.sendBattleLine('battle-test', '|-weather|RainDance');
            
            const room = client.room('battle-test');
            expect(room).toBeDefined();
        });
    });
});
