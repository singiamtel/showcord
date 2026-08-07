import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseRankCommand } from '@/client/commands/rankCommands';

function createCallbacks() {
    const messages: { roomID: string; content: string; type: string }[] = [];
    return {
        messages,
        callbacks: {
            getSelectedRoom: () => 'lobby',
            getUsername: () => 'testuser',
            addMessageToRoom: vi.fn((roomID: string, message: { content: string; type: string }) => {
                messages.push({ roomID, content: message.content, type: message.type });
            }),
            formatName: () => undefined,
        },
    };
}

describe('parseRankCommand', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('ignores unrelated messages', () => {
        const { callbacks } = createCallbacks();
        expect(parseRankCommand('hello world', callbacks)).toBe(false);
    });

    it('ignores unrelated commands', () => {
        const { callbacks } = createCallbacks();
        expect(parseRankCommand('/join lobby', callbacks)).toBe(false);
    });

    it('accepts all documented aliases', () => {
        for (const alias of ['rank', 'ranking', 'rating', 'ladder']) {
            const { callbacks } = createCallbacks();
            globalThis.fetch = vi.fn(async () => new Response(']{}')) as unknown as typeof fetch;
            expect(parseRankCommand(`/${alias} someuser`, callbacks)).toBe(true);
        }
    });

    it('renders ladder data for the given user', async () => {
        const { callbacks, messages } = createCallbacks();
        const rows = [
            { formatid: 'gen9ou', elo: 1500.4, gxe: 65.3, rpr: 1520, rprd: 50, w: 10, l: 5, t: 0 },
        ];
        globalThis.fetch = vi.fn(async () => new Response(`]${JSON.stringify(rows)}`)) as unknown as typeof fetch;

        expect(parseRankCommand('/rank someuser', callbacks)).toBe(true);
        await vi.waitFor(() => expect(messages.length).toBe(1));

        expect(messages[0].type).toBe('rawHTML');
        expect(messages[0].content).toContain('gen9ou');
        expect(messages[0].content).toContain('1500');
    });

    it('defaults to the current user when no target is given', async () => {
        const { callbacks, messages } = createCallbacks();
        const fetchMock = vi.fn(async (_url: string) => new Response(']{}'));
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        parseRankCommand('/rank', callbacks);
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(fetchMock.mock.calls[0][0]).toContain('user=testuser');
        void messages;
    });

    it('reports an error message when the fetch fails', async () => {
        const { callbacks, messages } = createCallbacks();
        globalThis.fetch = vi.fn(async () => { throw new Error('network error'); }) as unknown as typeof fetch;

        parseRankCommand('/rank someuser', callbacks);
        await vi.waitFor(() => expect(messages.length).toBe(1));
        expect(messages[0].content).toContain('Error fetching ranking data');
    });
});
