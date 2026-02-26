import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { enableMapSet } from 'immer';
import { assertNoUnexpectedConsoleErrors, clearExpectedConsoleErrors } from './harness/consoleGuard';

enableMapSet();

Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({})),
});

Object.defineProperty(globalThis, 'WebSocket', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
        send: vi.fn(),
        close: vi.fn(),
        onmessage: vi.fn(),
        onclose: vi.fn(),
    })),
});

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: localStorageMock,
});

let consoleErrorSpy;
let resetAllStores = () => {};
let hasLoadedStoreReset = false;

async function ensureStoreResetLoaded() {
    if (!hasLoadedStoreReset) {
        ({ resetAllStores } = await import('./harness/storeReset'));
        hasLoadedStoreReset = true;
    }
}

beforeEach(async () => {
    await ensureStoreResetLoaded();
    localStorageMock.clear();
    resetAllStores();
    clearExpectedConsoleErrors();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(async () => {
    await ensureStoreResetLoaded();
    assertNoUnexpectedConsoleErrors(consoleErrorSpy.mock.calls);
    cleanup();
    vi.restoreAllMocks();
    resetAllStores();
});
