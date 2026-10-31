import { toID } from '@/utils/generic';
import { Settings } from './settings';
import { useUserStore } from './stores/userStore';
import type { News } from '@/UI/components/NewsCard';
import type { RoomQuery } from '@/UI/components/RoomCard';

export interface UserDetails {
    userid: string;
    avatar?: string;
    name?: string;
    status?: string;
    rooms?: Record<string, { isPrivate: boolean }>;
}

export interface RoomsResponse {
    chat: RoomQuery[];
}

export interface Friend {
    userid: string;
    name: string;
    online: boolean;
    status: string;
    // The friends DB uses a LEFT JOIN; missing settings can produce null.
    // Zero also means hidden/unknown and must not be rendered as a date.
    last_login: number | null;
}

export type FriendsResponse =
    | { status: 'ready'; friends: Friend[] }
    | { status: 'unavailable' | 'malformed' | 'signed-out' };

const FRIENDS_TIMEOUT_MS = 10_000;

function isFriend(value: unknown): value is Friend {
    if (!value || typeof value !== 'object') return false;
    const friend = value as Record<string, unknown>;
    return typeof friend.userid === 'string' && /^[a-z0-9]+$/.test(friend.userid) &&
        typeof friend.name === 'string' && toID(friend.name) === friend.userid &&
        typeof friend.online === 'boolean' && typeof friend.status === 'string' &&
        (friend.last_login === null ||
            (typeof friend.last_login === 'number' && Number.isFinite(friend.last_login) && friend.last_login >= 0));
}

export interface QueryCallbacks {
    send: (message: string, room: string | false) => void;
}

export class QueryHandlers {
    private userListener: ((json: UserDetails) => void) | undefined;
    private roomListener: ((json: RoomsResponse) => void) | undefined;
    private cmdsearchListener: ((commands: string[]) => void) | undefined;
    // CRQ has no request IDs. Keep a cancelled/timed-out slot until its response
    // arrives so a late reply cannot populate a different account's request.
    private friendsRequest: {
        user: string;
        promise: Promise<FriendsResponse>;
        resolve: (response: FriendsResponse) => void;
        timer: ReturnType<typeof setTimeout>;
        settled: boolean;
    } | undefined;
    private roomsJSON: RoomsResponse | undefined;
    private news: News[] | undefined;
    private lastQueriedUser: { user: string; json: UserDetails } | undefined;

    constructor(
        private settings: Settings,
        private callbacks: QueryCallbacks
    ) {}

    queryUser(user: string): Promise<UserDetails> {
        if (this.lastQueriedUser && this.lastQueriedUser.user === user) {
            return Promise.resolve(this.lastQueriedUser.json);
        }
        return new Promise((resolve) => {
            this.userListener = resolve;
            this.callbacks.send(`/cmd userdetails ${user}`, false);
        });
    }

    async queryUserInternal(user: string) {
        await this.queryUser(user);
        if (toID(user) === this.settings.userID) {
            useUserStore.setState({ user: this.settings.username, avatar: this.settings.avatar });
        }
    }

    queryRooms(): Promise<RoomsResponse> {
        if (this.roomsJSON) {
            return Promise.resolve(this.roomsJSON);
        }
        return new Promise((resolve) => {
            this.callbacks.send(`/cmd rooms`, false);
            this.roomListener = resolve;
        });
    }

    async queryNews(): Promise<News[]> {
        if (this.news) {
            return this.news;
        }
        const res = await fetch(Settings.defaultNewsURL);
        const json = await res.json() as News[];
        this.news = json;
        return json;
    }

    handleUserDetailsResponse(json: UserDetails) {
        this.lastQueriedUser = { user: json.userid, json };
        if (this.userListener) {
            this.userListener(json);
            this.userListener = undefined;
        }
    }

    handleRoomsResponse(json: RoomsResponse) {
        this.roomsJSON = json;
        if (this.roomListener) {
            this.roomListener(json);
            this.roomListener = undefined;
        }
    }

    queryCmdsearch(prefix: string): Promise<string[]> {
        return new Promise((resolve) => {
            this.cmdsearchListener = resolve;
            this.callbacks.send(`/crq cmdsearch ${prefix}`, false);
        });
    }

    handleCmdsearchResponse(commands: string[]) {
        if (this.cmdsearchListener) {
            this.cmdsearchListener(commands);
            this.cmdsearchListener = undefined;
        }
    }

    queryFriends(): Promise<FriendsResponse> {
        const user = this.settings.userID;
        if (!user || user.startsWith('guest')) return Promise.resolve({ status: 'signed-out' });
        if (this.friendsRequest) {
            if (!this.friendsRequest.settled && this.friendsRequest.user === user) return this.friendsRequest.promise;
            return Promise.resolve({ status: 'unavailable' });
        }
        let resolve!: (response: FriendsResponse) => void;
        const promise = new Promise<FriendsResponse>((done) => { resolve = done; });
        const timer = setTimeout(() => this.cancelFriends(), FRIENDS_TIMEOUT_MS);
        this.friendsRequest = { user, promise, resolve, timer, settled: false };
        try {
            this.callbacks.send('/crq friends', false);
        } catch {
            this.cancelFriends(true);
        }
        return promise;
    }

    handleFriendsResponse(json: unknown) {
        const request = this.friendsRequest;
        if (!request) return;
        clearTimeout(request.timer);
        this.friendsRequest = undefined;
        if (request.settled) return;
        if (request.user !== this.settings.userID) {
            request.resolve({ status: 'unavailable' });
        } else if (json === null) {
            request.resolve({ status: 'unavailable' });
        } else if (!Array.isArray(json) || !json.every(isFriend)) {
            request.resolve({ status: 'malformed' });
        } else {
            const friends = [...new Map(json.map(friend => [friend.userid, friend])).values()];
            request.resolve({ status: 'ready', friends });
        }
    }

    cancelFriends(connectionClosed = false) {
        const request = this.friendsRequest;
        if (request) {
            clearTimeout(request.timer);
            request.settled = true;
            request.resolve({ status: 'unavailable' });
        }
        if (connectionClosed) this.friendsRequest = undefined;
    }

    hasUserListener(): boolean {
        return !!this.userListener;
    }
}
