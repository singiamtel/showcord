import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';


global.Notification = vi.fn().mockImplementation(() => ({
}));


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
