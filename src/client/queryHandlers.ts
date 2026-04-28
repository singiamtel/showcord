import { Settings } from './settings';
import { useUserStore } from './stores/userStore';

export interface QueryCallbacks {
    send: (message: string, room: string | false) => void;
}

export class QueryHandlers {
    private userListener: ((json: any) => any) | undefined;
    private roomListener: ((json: any) => any) | undefined;
    private roomsJSON: any = undefined;
    private news: any = undefined;
    private lastQueriedUser: { user: string; json: any } | undefined;

    constructor(
        private settings: Settings,
        private callbacks: QueryCallbacks
    ) {}

    queryUser(user: string): Promise<any> {
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

    queryRooms(): Promise<any> {
        if (this.roomsJSON) {
            return Promise.resolve(this.roomsJSON);
        }
        return new Promise((resolve) => {
            this.callbacks.send(`/cmd rooms`, false);
            this.roomListener = resolve;
        });
    }

    async queryNews(): Promise<any> {
        if (this.news) {
            return this.news;
        }
        const res = await fetch(Settings.defaultNewsURL);
        const json = await res.json();
        this.news = json;
        return json;
    }

    handleUserDetailsResponse(json: any) {
        this.lastQueriedUser = { user: json.userid, json };
        if (this.userListener) {
            this.userListener(json);
            this.userListener = undefined;
        }
    }

    handleRoomsResponse(json: any) {
        this.roomsJSON = json;
        if (this.roomListener) {
            this.roomListener(json);
            this.roomListener = undefined;
        }
    }

    hasUserListener(): boolean {
        return !!this.userListener;
    }
}
