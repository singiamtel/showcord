import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClientHarness, type ClientHarness } from '../harness/clientHarness';
import { QueryHandlers } from '@/client/queryHandlers';
import { Settings } from '@/client/settings';
import { useUserStore } from '@/client/stores/userStore';

const friend = { userid: 'alice', name: 'Alice', online: true, status: 'busy', last_login: 0 };
let harness: ClientHarness | undefined;
afterEach(() => { harness?.cleanup(); harness = undefined; vi.useRealTimers(); });

function setup() {
    harness = createClientHarness({ username: 'testuser' });
    return harness;
}

describe('friends protocol', () => {
    it('sends one structured query for concurrent consumers and handles room-scoped responses with pipes', async () => {
        const { client, webSocket } = setup();
        const send = vi.spyOn(webSocket, 'send');
        const first = client.queryFriends();
        expect(client.queryFriends()).toBe(first);
        expect(send).toHaveBeenCalledExactlyOnceWith('|/crq friends');
        webSocket.triggerMessage(`>lobby\n|queryresponse|friends|${JSON.stringify([{ ...friend, status: 'busy|extra' }, friend])}\n|queryresponse|cmdsearch|[]`);
        await expect(first).resolves.toEqual({ status: 'ready', friends: [friend] });
    });

    it('keeps empty lists distinct from unavailable lists', async () => {
        const { client, webSocket } = setup();
        const empty = client.queryFriends();
        webSocket.triggerMessage('|queryresponse|friends|[]');
        await expect(empty).resolves.toEqual({ status: 'ready', friends: [] });
        const denied = client.queryFriends();
        webSocket.triggerMessage('|queryresponse|friends|null');
        await expect(denied).resolves.toEqual({ status: 'unavailable' });
    });

    it.each(['{broken', '{}', 'false', '[null]', JSON.stringify([{ ...friend, online: 'yes' }]),
        JSON.stringify([{ ...friend, userid: '../bad' }]), JSON.stringify([{ ...friend, name: 'Other' }]),
        JSON.stringify([{ ...friend, last_login: -1 }])])('settles malformed response %s without breaking following protocol lines', async payload => {
        const { client, webSocket } = setup();
        const response = client.queryFriends();
        webSocket.triggerMessage(`|queryresponse|friends|${payload}\n|challstr|4|still-parsing`);
        await expect(response).resolves.toEqual({ status: 'malformed' });
    });

    it('times out silent servers without polling and drains late replies before retrying', async () => {
        vi.useFakeTimers();
        const { client, webSocket } = setup();
        const send = vi.spyOn(webSocket, 'send');
        const response = client.queryFriends();
        await vi.advanceTimersByTimeAsync(10_000);
        await expect(response).resolves.toEqual({ status: 'unavailable' });
        await expect(client.queryFriends()).resolves.toEqual({ status: 'unavailable' });
        expect(send).toHaveBeenCalledTimes(1);
        webSocket.triggerMessage(`|queryresponse|friends|${JSON.stringify([friend])}`);
        const retry = client.queryFriends();
        webSocket.triggerMessage('|queryresponse|friends|[]');
        await expect(retry).resolves.toEqual({ status: 'ready', friends: [] });
    });

    it('does not send a query for guests or disconnected clients', async () => {
        const { client, webSocket } = setup();
        const send = vi.spyOn(webSocket, 'send');
        client.settings.username = 'Guest 123';
        await expect(client.queryFriends()).resolves.toEqual({ status: 'signed-out' });
        webSocket.readyState = 3;
        await expect(client.queryFriends()).resolves.toEqual({ status: 'unavailable' });
        expect(send).not.toHaveBeenCalled();
    });

    it('cancels on logout and discards the old account reply', async () => {
        const { client, webSocket } = setup();
        const response = client.queryFriends();
        client.logout();
        await expect(response).resolves.toEqual({ status: 'unavailable' });
        client.settings.username = 'anotheruser';
        await expect(client.queryFriends()).resolves.toEqual({ status: 'unavailable' });
        webSocket.triggerMessage(`|queryresponse|friends|${JSON.stringify([friend])}`);
        const retry = client.queryFriends();
        webSocket.triggerMessage('|queryresponse|friends|[]');
        await expect(retry).resolves.toEqual({ status: 'ready', friends: [] });
    });

    it('clears the previous identity immediately on a server rename and rejects its pending friends reply', async () => {
        const { client, webSocket } = setup();
        useUserStore.setState({ user: 'testuser' });
        const response = client.queryFriends();
        webSocket.triggerMessage('|updateuser|Another User|1|1');
        expect(useUserStore.getState().user).toBeUndefined();
        await expect(response).resolves.toEqual({ status: 'unavailable' });
        webSocket.triggerMessage(`|queryresponse|friends|${JSON.stringify([friend])}`);
        webSocket.triggerMessage('|queryresponse|userdetails|{"userid":"anotheruser"}');
        await Promise.resolve();
        expect(useUserStore.getState().user).toBe('Another User');
        const retry = client.queryFriends();
        webSocket.triggerMessage('|queryresponse|friends|[]');
        await expect(retry).resolves.toEqual({ status: 'ready', friends: [] });
    });

    it('cancels on unexpected disconnection and permits a fresh request on a new connection', async () => {
        vi.useFakeTimers();
        const { client, webSocket } = setup();
        const response = client.queryFriends();
        webSocket.triggerClose();
        await expect(response).resolves.toEqual({ status: 'unavailable' });
        expect(useUserStore.getState().user).toBeUndefined();
        await vi.advanceTimersByTimeAsync(1_000);
        webSocket.triggerOpen();
        const retry = client.queryFriends();
        webSocket.triggerMessage('|queryresponse|friends|[]');
        await expect(retry).resolves.toEqual({ status: 'ready', friends: [] });
    });

    it('settles pending requests and clears timers on stop', async () => {
        vi.useFakeTimers();
        const { client } = setup();
        const response = client.queryFriends();
        client.stop();
        await expect(response).resolves.toEqual({ status: 'unavailable' });
        expect(vi.getTimerCount()).toBe(0);
    });

    it('accepts unknown last login and future fields', async () => {
        const { client, webSocket } = setup();
        const response = client.queryFriends();
        webSocket.triggerMessage(`|queryresponse|friends|${JSON.stringify([{ ...friend, last_login: null, future: true }])}`);
        await expect(response).resolves.toEqual({ status: 'ready', friends: [{ ...friend, last_login: null, future: true }] });
    });

    it('handles a send failure', async () => {
        const settings = new Settings();
        settings.username = 'testuser';
        const queries = new QueryHandlers(settings, { send: () => { throw new Error('closed'); } });
        await expect(queries.queryFriends()).resolves.toEqual({ status: 'unavailable' });
    });
});
