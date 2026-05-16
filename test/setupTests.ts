import { afterEach, beforeEach, vi, type MockInstance } from 'vitest';
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

interface LocalStorageMock {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
}

const localStorageMock: LocalStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
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

let consoleErrorSpy: MockInstance;
let resetAllStores: () => void = () => {};
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
