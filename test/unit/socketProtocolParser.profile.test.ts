import { describe, it, expect, vi } from 'vitest';
import { SocketProtocolParser } from '../../src/client/socketProtocolParser';
import { Settings } from '../../src/client/settings';
import { QueryHandlers } from '../../src/client/queryHandlers';
import { useRoomStore } from '../../src/client/stores/roomStore';
import { useMessageStore } from '../../src/client/stores/messageStore';
import type { ProtocolParserCallbacks } from '../../src/client/socketProtocolParser';

function createParser(): SocketProtocolParser {
    const settings = new Settings();
    settings.username = 'testuser';

    const callbacks: ProtocolParserCallbacks = {
        getRoom: (roomID: string) => useRoomStore.getState().rooms.get(roomID),
        getRooms: () => new Map(useRoomStore.getState().rooms),
        getSelectedRoom: () => 'lobby',
        removeRoom: (roomID: string) => { useRoomStore.getState().removeRoom(roomID); },
        setUsername: vi.fn(),
        forceHighlightMsg: () => false,
        shouldAutoSelect: () => false,
        selectRoom: vi.fn(),
    };

    const queryHandlers = new QueryHandlers(settings, { send: vi.fn() });
    return new SocketProtocolParser(settings, callbacks, queryHandlers);
}

function makeLobbyChatChunk(numMessages: number): string {
    let chunk = '>lobby\n|init|chat\n|title|Lobby\n|users|3, user1, user2, user3\n';
    for (let i = 0; i < numMessages; i++) {
        chunk += `|chat|user${i % 10}|this is test message number ${i} hello everyone how are you\n`;
    }
    return chunk;
}

function makePMChunk(numMessages: number): string {
    let chunk = '';
    for (let i = 0; i < numMessages; i++) {
        chunk += `|pm|user${i % 10}|testuser|hello this is a private message ${i}\n`;
    }
    return chunk;
}

function makeBattleChunk(numTurns: number): string {
    let chunk = '>battle-gen9randombattle-12345\n'
        + '|init|battle\n'
        + '|title|testuser vs. opponent\n'
        + '|player|p1|testuser|100\n'
        + '|player|p2|opponent|200\n';
    for (let i = 0; i < numTurns / 2; i++) {
        chunk += '|gametype|singles\n'
            + '|gen|9\n'
            + '|tier|Random Battle\n'
            + '|start\n'
            + '|teamsize|p1|6\n'
            + '|teamsize|p2|6\n'
            + '|switch|p1a: PokemonA|PokemonA, L100, M\n'
            + '|switch|p2a: PokemonB|PokemonB, L100, M\n'
            + '|-ability|p1a: PokemonA|Intimidate\n'
            + '|move|p1a: PokemonA|Tackle|p2a: PokemonB\n'
            + '|-damage|p2a: PokemonB|25/100\n'
            + '|move|p2a: PokemonB|Growl\n'
            + '|-unboost|p1a: PokemonA|atk|1\n'
            + `|turn|${i + 1}\n`;
    }
    return chunk;
}

function makeMixedChunk(): string {
    return '>lobby\n|init|chat\n|title|Lobby\n|users|3, user1, user2, user3\n'
        + '|chat|user1|hello mixed workload\n'
        + '|chat|user2|another message here\n'
        + '|pm|sender1|testuser|private msg\n'
        + '|chat|user3|continuing conversation\n'
        + '|pm|sender2|testuser|another pm\n'
        + '|chat|user1|last message\n';
}

function runProfile(label: string, chunk: string, iterations: number): void {
    const times: number[] = [];
    const lines = chunk.split('\n').filter(l => l !== '' && !l.startsWith('>')).length;

    for (let i = 0; i < iterations; i++) {
        const parser = createParser();
        const start = performance.now();
        parser.parseSocketChunk(chunk);
        const elapsed = performance.now() - start;
        times.push(elapsed);
    }

    times.sort((a, b) => a - b);
    const total = times.reduce((a, b) => a + b, 0);
    const mean = total / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p99 = times[Math.floor(times.length * 0.99)];
    const min = times[0];
    const max = times[times.length - 1];

    const out = `\n--- ${label} ---`
        + `\n  Lines/chunk: ${lines}`
        + `\n  Iterations:  ${iterations}`
        + `\n  Mean:   ${mean.toFixed(4)} ms`
        + `\n  Median: ${median.toFixed(4)} ms`
        + `\n  P99:    ${p99.toFixed(4)} ms`
        + `\n  Min:    ${min.toFixed(4)} ms`
        + `\n  Max:    ${max.toFixed(4)} ms`
        + `\n  Total:  ${total.toFixed(2)} ms\n`;
    process.stdout.write(out);

    expect(mean).toBeLessThan(100);
}

describe('parseSocketChunk profile', () => {
    it('profile: lobby chat (10 msgs/chunk)', () => {
        runProfile('Lobby Chat (10)', makeLobbyChatChunk(10), 200);
    });

    it('profile: lobby chat (50 msgs/chunk)', () => {
        runProfile('Lobby Chat (50)', makeLobbyChatChunk(50), 200);
    });

    it('profile: lobby chat (200 msgs/chunk)', () => {
        runProfile('Lobby Chat (200)', makeLobbyChatChunk(200), 200);
    });

    it('profile: PM (50 msgs/chunk)', () => {
        runProfile('PM (50)', makePMChunk(50), 200);
    });

    it('profile: battle (10 turns/chunk)', () => {
        runProfile('Battle (10 turns)', makeBattleChunk(10), 200);
    });

    it('profile: battle (50 turns/chunk)', () => {
        runProfile('Battle (50 turns)', makeBattleChunk(50), 200);
    });

    it('profile: mixed workload', () => {
        runProfile('Mixed (7 lines)', makeMixedChunk(), 200);
    });
});
