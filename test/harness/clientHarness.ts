import { Client } from '@/client/client';
import { BattleRoom } from '@/client/room/battleRoom';
import { vi } from 'vitest';
import { createMockWebSocket, MockServer } from '../helpers/mockServer';
import { resetAllStores } from './storeReset';

type ClientHarnessOptions = {
    autoLogin?: boolean;
    autoOpen?: boolean;
    confirmResult?: boolean;
    username?: string;
};

export type ClientHarness = ReturnType<typeof createClientHarness>;

export function createClientHarness(options: ClientHarnessOptions = {}) {
    resetAllStores();

    const originalWebSocket = globalThis.WebSocket;
    const originalConfirm = window.confirm;

    const webSocket = createMockWebSocket();
    globalThis.WebSocket = vi.fn(function() { return webSocket; }) as any;

    if (options.confirmResult !== undefined) {
        const confirmResult = options.confirmResult;
        window.confirm = vi.fn(() => confirmResult);
    }

    const server = new MockServer((data) => {
        webSocket.triggerMessage(data);
    });

    const client = new Client({
        autoLogin: options.autoLogin ?? false,
        skipVitestCheck: true,
    });

    if (options.autoOpen !== false) {
        webSocket.triggerOpen();
    }

    if (options.username) {
        client.settings.username = options.username;
    }

    const room = <TRoom = ReturnType<Client['room']>>(roomID: string) => {
        return client.room(roomID) as TRoom;
    };

    const flush = async (ticks = 2) => {
        for (let i = 0; i < ticks; i++) {
            await Promise.resolve();
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    };

    const waitForBattleEngine = async (roomID: string, timeoutMs = 1_000) => {
        const startedAt = Date.now();

        for (;;) {
            const battleRoom = room<BattleRoom | undefined>(roomID);
            if (battleRoom && battleRoom.formatter) {
                return battleRoom;
            }

            if (Date.now() - startedAt > timeoutMs) {
                throw new Error(
                    `Battle engine did not initialize for room "${roomID}" within ${timeoutMs}ms.`,
                );
            }

            await flush(1);
        }
    };

    const cleanup = () => {
        client.destroy();
        globalThis.WebSocket = originalWebSocket;
        window.confirm = originalConfirm;
        resetAllStores();
    };

    return {
        client,
        server,
        webSocket,
        room,
        flush,
        waitForBattleEngine,
        cleanup,
    };
}
