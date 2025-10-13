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

    async queryUser(user: string, callback: (json: any) => void) {
        if (this.lastQueriedUser && this.lastQueriedUser.user === user) {
            callback(this.lastQueriedUser.json);
            this.callbacks.send(`/cmd userdetails ${user}`, false);
            this.userListener = callback;
        }
        this.callbacks.send(`/cmd userdetails ${user}`, false);
        this.userListener = callback;
    }

    queryUserInternal(user: string) {
        this.queryUser(user, (_json) => {
            useUserStore.setState({ user: this.settings.username, avatar: this.settings.avatar });
        });
    }

    async queryRooms(callback: (json: any) => void) {
        if (this.roomsJSON) {
            callback(this.roomsJSON);
            return;
        }
        this.callbacks.send(`/cmd rooms`, false);
        this.roomListener = callback;
    }

    async queryNews(callback: (json: any) => void) {
        if (this.news) {
            return callback(this.news);
        }
        fetch(Settings.defaultNewsURL).then((res) => res.json()).then((json) => {
            this.news = json;
            callback(json);
        });
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
