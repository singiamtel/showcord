import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { enableMapSet } from 'immer';

enableMapSet();

global.Notification = vi.fn().mockImplementation(() => ({
}));


global.Websocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    onmessage: vi.fn(),
    onclose: vi.fn(),
}));

// Mock localStorage for happy-dom
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

global.localStorage = localStorageMock;

// Clear localStorage before each test
beforeEach(() => {
    localStorageMock.clear();
});

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
