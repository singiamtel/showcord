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

export interface QueryCallbacks {
    send: (message: string, room: string | false) => void;
}

export class QueryHandlers {
    private userListener: ((json: UserDetails) => void) | undefined;
    private roomListener: ((json: RoomsResponse) => void) | undefined;
    private cmdsearchListener: ((commands: string[]) => void) | undefined;
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
        useUserStore.setState({ user: this.settings.username, avatar: this.settings.avatar });
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

    hasUserListener(): boolean {
        return !!this.userListener;
    }
}
