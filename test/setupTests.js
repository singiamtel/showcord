import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// eslint-disable-next-line no-undef
global.Notification = vi.fn().mockImplementation(() => ({
}));

// eslint-disable-next-line no-undef
global.Websocket = vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    onmessage: vi.fn(),
    onclose: vi.fn(),
}));

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
