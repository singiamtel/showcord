import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FriendsList from '@/UI/components/FriendsList';
import { useUserStore } from '@/client/stores/userStore';
import { useAppStore } from '@/client/stores/appStore';
import type { FriendsResponse } from '@/client/queryHandlers';

const { queryFriends, createPM, clickUsername } = vi.hoisted(() => ({
    queryFriends: vi.fn(), createPM: vi.fn(), clickUsername: vi.fn(),
}));
const client = { queryFriends, createPM };
vi.mock('@/UI/components/single/useClientContext', () => ({ useClientContext: () => ({ client }) }));
vi.mock('@/UI/components/single/TrainerCard/useTrainerCard', () => ({ useTrainerCard: () => ({ clickUsername }) }));

function setup(response: FriendsResponse = { status: 'ready', friends: [] }) {
    queryFriends.mockReset().mockResolvedValue(response);
    createPM.mockReset();
    clickUsername.mockReset();
    useAppStore.setState({ isConnected: true });
    useUserStore.setState({ user: 'testuser' });
    return render(<FriendsList />);
}

describe('Friends list', () => {
    it('shows login and connection states without sending a request', () => {
        queryFriends.mockReset();
        useAppStore.setState({ isConnected: true });
        render(<FriendsList />);
        expect(screen.getByText('Log in to view your friends.')).toBeInTheDocument();
        act(() => useAppStore.setState({ isConnected: false }));
        expect(screen.getByText('Connect to view your friends.')).toBeInTheDocument();
        expect(queryFriends).not.toHaveBeenCalled();
    });

    it('sorts online friends first, shows statuses, and uses existing profile and PM interactions', async () => {
        setup({ status: 'ready', friends: [
            { userid: 'alice', name: 'Alice', online: false, status: 'busy', last_login: 0 },
            { userid: 'bob', name: 'Bob', online: true, status: 'busy', last_login: 1234 },
            { userid: 'carol', name: 'Carol', online: true, status: 'idle', last_login: 0 },
        ] });
        expect(screen.getByText('Loading friends…')).toBeInTheDocument();
        await screen.findByRole('button', { name: 'Bob' });
        expect(screen.getAllByRole('listitem').map(row => row.textContent)).toEqual([
            'BobBusyMessage', 'CarolAwayMessage', 'AliceOfflineMessage',
        ]);
        fireEvent.click(screen.getByRole('button', { name: 'Bob' }));
        expect(clickUsername).toHaveBeenCalledOnce();
        fireEvent.click(screen.getByRole('button', { name: 'Message Bob' }));
        expect(createPM).toHaveBeenCalledExactlyOnceWith('bob');
        expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
        expect(queryFriends).toHaveBeenCalledTimes(1);
    });

    it.each([
        [{ status: 'ready', friends: [] }, 'No friends yet.'],
        [{ status: 'unavailable' }, /Friends are unavailable/],
        [{ status: 'malformed' }, /Could not read the friends list/],
    ] satisfies [FriendsResponse, string | RegExp][])('handles %j and refreshes only on request', async (response, message) => {
        setup(response);
        await screen.findByText(message);
        expect(queryFriends).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Refresh friends' }));
        await waitFor(() => expect(queryFriends).toHaveBeenCalledTimes(2));
    });

    it('hides previous account data immediately and ignores an outstanding reply after logout', async () => {
        let resolve!: (response: FriendsResponse) => void;
        setup();
        await screen.findByText('No friends yet.');
        queryFriends.mockReturnValueOnce(new Promise<FriendsResponse>(done => { resolve = done; }));
        act(() => useUserStore.setState({ user: 'otheruser' }));
        expect(screen.queryByText('No friends yet.')).not.toBeInTheDocument();
        act(() => useUserStore.setState({ user: undefined }));
        await act(async () => resolve({ status: 'ready', friends: [
            { userid: 'alice', name: 'Alice', online: true, status: 'online', last_login: 0 },
        ] }));
        expect(screen.queryByRole('button', { name: 'Alice' })).not.toBeInTheDocument();
        expect(screen.getByText('Log in to view your friends.')).toBeInTheDocument();
    });
});
