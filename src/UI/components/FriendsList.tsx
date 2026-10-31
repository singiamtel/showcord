import { useEffect, useState } from 'react';
import { FaCommentAlt, FaSyncAlt } from 'react-icons/fa';
import type { FriendsResponse } from '@/client/queryHandlers';
import { useUserStore } from '@/client/stores/userStore';
import { useAppStore } from '@/client/stores/appStore';
import { useClientContext } from './single/useClientContext';
import { Username } from './Username';

function FriendsForUser() {
    const { client } = useClientContext();
    const [result, setResult] = useState<FriendsResponse>();
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        let active = true;
        client.queryFriends().then(response => {
            if (active) setResult(response);
        });
        return () => { active = false; };
    }, [client, refresh]);

    const friends = result?.status === 'ready' ? [...result.friends].sort((a, b) =>
        Number(b.online) - Number(a.online) || a.name.localeCompare(b.name)) : [];

    return (
        <>
            <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded text-sm text-blue-300 hover:bg-blue-300/10 focus-visible:outline-2 focus-visible:outline-blue-300 disabled:opacity-50 mb-2 shrink-0 self-start"
                aria-label="Refresh friends"
                title="Refresh friends"
                disabled={!result}
                onClick={() => {
                    setResult(undefined);
                    setRefresh(value => value + 1);
                }}
            >
                <FaSyncAlt aria-hidden="true" />
            </button>
            <div aria-live="polite" className="text-xs text-gray-125 overflow-y-auto min-h-0">
                {!result && <p>Loading friends…</p>}
                {result?.status === 'signed-out' && <p>Log in to view your friends.</p>}
                {result?.status === 'unavailable' && (
                    <p>Friends are unavailable for this account or server. An autoconfirmed account is required. Try refreshing or reconnecting.</p>
                )}
                {result?.status === 'malformed' && <p>Could not read the friends list. Try refreshing.</p>}
                {result?.status === 'ready' && friends.length === 0 && <p>No friends yet.</p>}
                {friends.length > 0 && (
                    <ul className="space-y-2">
                        {friends.map(friend => (
                            <li key={friend.userid} className="flex items-center gap-2">
                                <span aria-hidden="true" className={`h-2 w-2 rounded-full shrink-0 ${friend.online ? 'bg-green-500' : 'bg-gray-175'}`} />
                                <div className="min-w-0 flex-1">
                                    <Username user={` ${friend.name}`} bold className="max-w-full truncate" />
                                    <p>{!friend.online ? 'Offline' : friend.status === 'busy' ? 'Busy' : friend.status === 'idle' ? 'Away' : 'Online'}</p>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded text-sm text-blue-300 hover:bg-blue-300/10 focus-visible:outline-2 focus-visible:outline-blue-300 shrink-0"
                                    aria-label={`Message ${friend.name}`}
                                    title={`Message ${friend.name}`}
                                    onClick={() => client.createPM(friend.userid)}
                                >
                                    <FaCommentAlt aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

export default function FriendsList() {
    const user = useUserStore(state => state.user);
    const connected = useAppStore(state => state.isConnected);

    return (
        <section aria-label="Friends" className="flex flex-col min-h-0 max-h-80 md:flex-1 p-4 rounded-xl bg-gray-100 dark:bg-gray-600">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-125 mb-3 shrink-0">Friends</h2>
            {!connected ? <p className="text-xs text-gray-125">Connect to view your friends.</p> :
                !user ? <p className="text-xs text-gray-125">Log in to view your friends.</p> :
                    <FriendsForUser key={user} />}
        </section>
    );
}
