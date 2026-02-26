import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Client } from '@/client/client';
import { BattleRoom } from '@/client/room/battleRoom';
import { createClientHarness, type ClientHarness } from '../harness/clientHarness';

describe('Battle Room Integration Tests', () => {
    let harness: ClientHarness;
    let mockServer: ClientHarness['server'];
    let client: Client;

    beforeEach(() => {
        harness = createClientHarness();
        mockServer = harness.server;
        client = harness.client;
    });

    afterEach(() => {
        harness.cleanup();
    });

    describe('Battle Initialization', () => {
        it('should create battle room on |init|battle', async () => {
            const roomID = 'battle-gen9ou-12345';
            mockServer.joinRoom(roomID, 'battle');

            const room = harness.room<BattleRoom | undefined>(roomID);
            expect(room).toBeDefined();
            expect(room).toBeInstanceOf(BattleRoom);
            expect(room?.type).toBe('battle');

            const initializedRoom = await harness.waitForBattleEngine(roomID);
            expect(initializedRoom.formatter).toBeTruthy();
        });

        it('should set room title for battle', () => {
            const roomID = 'battle-gen9ou-12345';
            mockServer.joinRoom(roomID, 'battle');
            mockServer.sendBattleTeamSize(roomID, 'p1', 6);
            mockServer.sendBattleTeamSize(roomID, 'p2', 6);
            mockServer.setRoomTitle(roomID, 'Player1 vs Player2');

            const room = harness.room<BattleRoom | undefined>(roomID);
            expect(room?.name).toBe('Player1 vs Player2');
            expect(room?.log).toContain('|teamsize|p1|6');
            expect(room?.log).toContain('|teamsize|p2|6');
        });
    });

    describe('Player Setup', () => {
        beforeEach(() => {
            mockServer.joinRoom('battle-test', 'battle');
            mockServer.sendBattleTeamSize('battle-test', 'p1', 6);
            mockServer.sendBattleTeamSize('battle-test', 'p2', 6);
            mockServer.updateUser('testuser', '1', 'lucas');
        });

        it('should handle player message', () => {
            mockServer.sendBattlePlayer('battle-test', 'p1', 'testuser', 'lucas');

            const room = harness.room<BattleRoom>('battle-test');
            expect(room).toBeDefined();
            expect(room.isPlayer).toBe(true);
        });

        it('should set perspective for own player', () => {
            mockServer.sendBattlePlayer('battle-test', 'p2', 'testuser', 'lucas');

            const room = harness.room<BattleRoom>('battle-test');
            expect(room).toBeDefined();
            expect(room.perspective).toBe('p2');
        });
    });

    describe('Battle Requests', () => {
        beforeEach(async () => {
            mockServer.joinRoom('battle-test', 'battle');
            mockServer.sendBattleTeamSize('battle-test', 'p1', 6);
            mockServer.sendBattleTeamSize('battle-test', 'p2', 6);
            mockServer.updateUser('testuser', '1', 'lucas');
            mockServer.sendBattlePlayer('battle-test', 'p1', 'testuser');
            await harness.waitForBattleEngine('battle-test');
        });

        it('should handle move request', async () => {
            const moveRequest = {
                active: [{
                    moves: [
                        { move: 'Tackle', id: 'tackle', pp: 35, maxpp: 56, target: 'normal', disabled: false },
                    ],
                }],
                side: {
                    name: 'testuser',
                    id: 'p1',
                    pokemon: [
                        {
                            ident: 'p1: Pikachu',
                            details: 'Pikachu, L50, M',
                            condition: '100/100',
                            active: true,
                            stats: { atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
                            moves: ['tackle'],
                            baseAbility: 'static',
                            item: '',
                            pokeball: 'pokeball',
                        },
                    ],
                },
                rqid: 1,
            };

            mockServer.sendBattleRequest('battle-test', moveRequest);

            await harness.flush();

            const room = harness.room<BattleRoom>('battle-test');
            expect(room).toBeDefined();
            expect(room.log.some((line) => line.startsWith('|request|'))).toBe(true);
            expect(room.battle.request).toBeDefined();
            expect(room.battle.request.side.id).toBe('p1');
        });

        it('should handle switch request', async () => {
            const switchRequest = {
                side: {
                    name: 'testuser',
                    id: 'p1',
                    pokemon: [
                        {
                            ident: 'p1: Pikachu',
                            details: 'Pikachu, L50, M',
                            condition: '100/100',
                            active: true,
                            stats: { atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
                            moves: ['tackle'],
                            baseAbility: 'static',
                            item: '',
                            pokeball: 'pokeball',
                        },
                        {
                            ident: 'p1: Charizard',
                            details: 'Charizard, L50, M',
                            condition: '100/100',
                            active: false,
                            stats: { atk: 84, def: 78, spa: 109, spd: 85, spe: 100 },
                            moves: ['flamethrower'],
                            baseAbility: 'blaze',
                            item: '',
                            pokeball: 'pokeball',
                        },
                    ],
                },
                forceSwitch: [true],
                rqid: 2,
            };

            mockServer.sendBattleRequest('battle-test', switchRequest);

            await harness.flush();

            const room = harness.room<BattleRoom>('battle-test');
            expect(room).toBeDefined();
            expect(room.battle.request).toBeDefined();
            expect(room.battle.request.side.pokemon.length).toBe(2);
        });

        it('should handle team preview request', async () => {
            const teamRequest = {
                side: {
                    name: 'testuser',
                    id: 'p1',
                    pokemon: [
                        {
                            ident: 'p1: Pikachu',
                            details: 'Pikachu, L50, M',
                            condition: '100/100',
                            active: true,
                            stats: { atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
                            moves: ['tackle'],
                            baseAbility: 'static',
                            item: '',
                            pokeball: 'pokeball',
                        },
                    ],
                },
                teamPreview: true,
                maxTeamSize: 1,
                rqid: 3,
            };

            mockServer.sendBattleRequest('battle-test', teamRequest);

            await harness.flush();

            const room = harness.room<BattleRoom>('battle-test');
            expect(room).toBeDefined();
            expect(room.battle.request).toBeDefined();
            expect(room.battle.request.maxTeamSize).toBe(1);
        });
    });
});
