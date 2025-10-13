export class MockServer {
    private messageHandler: ((data: string) => void) | undefined;

    constructor(onMessage: (data: string) => void) {
        this.messageHandler = onMessage;
    }

    send(message: string) {
        if (this.messageHandler) {
            this.messageHandler(message);
        }
    }

    sendChallstr(challstr: string) {
        this.send(`|challstr|${challstr}`);
    }

    joinRoom(roomId: string, type: 'chat' | 'battle' = 'chat') {
        this.send(`>${roomId}\n|init|${type}`);
    }

    setRoomTitle(roomId: string, title: string) {
        this.send(`>${roomId}\n|title|${title}`);
    }

    sendUserList(roomId: string, users: string[]) {
        const userStr = users.map(u => u.startsWith(' ') ? u : ` ${u}`).join(',');
        this.send(`>${roomId}\n|users|${users.length},${userStr}`);
    }

    sendChat(roomId: string, user: string, message: string, timestamp?: string) {
        if (timestamp) {
            this.send(`>${roomId}\n|c:|${timestamp}|${user}|${message}`);
        } else {
            this.send(`>${roomId}\n|chat|${user}|${message}`);
        }
    }

    sendPM(from: string, to: string, message: string) {
        this.send(`|pm|${from}|${to}|${message}`);
    }

    userJoin(roomId: string, username: string) {
        this.send(`>${roomId}\n|join|${username}`);
    }

    userLeave(roomId: string, username: string) {
        this.send(`>${roomId}\n|leave|${username}`);
    }

    userRename(roomId: string, newName: string, oldId: string) {
        this.send(`>${roomId}\n|name|${newName}|${oldId}`);
    }

    updateUser(username: string, named: '0' | '1', avatar: string) {
        this.send(`|updateuser|${username}|${named}|${avatar}`);
    }

    sendQueryResponse(type: 'userdetails' | 'rooms', json: any) {
        this.send(`|queryresponse|${type}|${JSON.stringify(json)}`);
    }

    sendError(roomId: string, message: string) {
        this.send(`>${roomId}\n|error|${message}`);
    }

    sendNoInit(roomId: string, reason: 'namerequired' | 'nonexistent' | 'joinfailed', message?: string) {
        if (message) {
            this.send(`>${roomId}\n|noinit|${reason}|${message}`);
        } else {
            this.send(`>${roomId}\n|noinit|${reason}`);
        }
    }

    deinitRoom(roomId: string) {
        this.send(`>${roomId}\n|deinit`);
    }

    sendUHTML(roomId: string, name: string, html: string) {
        this.send(`>${roomId}\n|uhtml|${name}|${html}`);
    }

    sendUHTMLChange(roomId: string, name: string, html: string) {
        this.send(`>${roomId}\n|uhtmlchange|${name}|${html}`);
    }

    sendRaw(roomId: string, html: string) {
        this.send(`>${roomId}\n|raw|${html}`);
    }

    sendHTML(roomId: string, html: string) {
        this.send(`>${roomId}\n|html|${html}`);
    }

    sendFormats(formats: string[]) {
        this.send(`|formats|${formats.join('|')}`);
    }

    sendBattlePlayer(roomId: string, perspective: 'p1' | 'p2' | 'p3' | 'p4', name: string, avatar?: string) {
        if (avatar) {
            this.send(`>${roomId}\n|player|${perspective}|${name}|${avatar}`);
        } else {
            this.send(`>${roomId}\n|player|${perspective}|${name}`);
        }
    }

    sendBattleRequest(roomId: string, requestJson: any) {
        this.send(`>${roomId}\n|request|${JSON.stringify(requestJson)}`);
    }

    sendBattleLine(roomId: string, line: string) {
        this.send(`>${roomId}\n${line}`);
    }

    sendBattleStart(roomId: string) {
        this.send(`>${roomId}\n|start`);
    }

    sendBattleWin(roomId: string, winner: string) {
        this.send(`>${roomId}\n|win|${winner}`);
    }

    sendBattleTie(roomId: string) {
        this.send(`>${roomId}\n|tie`);
    }
}

export function createMockWebSocket() {
    const listeners: Record<string, Function[]> = {
        open: [],
        message: [],
        error: [],
        close: [],
    };

    const mockWS = {
        readyState: 0,
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
        send: (() => {}) as any,
        close: (() => {
            mockWS.readyState = 3;
            const event = { type: 'close' };
            if (mockWS.onclose) mockWS.onclose(event);
            listeners.close.forEach(fn => fn(event));
        }) as any,
        addEventListener: ((event: string, handler: Function) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        }) as any,
        removeEventListener: ((event: string, handler: Function) => {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(fn => fn !== handler);
            }
        }) as any,
        onopen: null as ((event: any) => void) | null,
        onmessage: null as ((event: any) => void) | null,
        onerror: null as ((event: any) => void) | null,
        onclose: null as ((event: any) => void) | null,

        triggerOpen() {
            mockWS.readyState = 1;
            if (mockWS.onopen) mockWS.onopen({ type: 'open' });
            listeners.open.forEach(fn => fn({ type: 'open' }));
        },

        triggerMessage(data: string) {
            const event = { type: 'message', data };
            if (mockWS.onmessage) mockWS.onmessage(event);
            listeners.message.forEach(fn => fn(event));
        },

        triggerError(error: any) {
            const event = { type: 'error', error };
            if (mockWS.onerror) mockWS.onerror(event);
            listeners.error.forEach(fn => fn(event));
        },

        triggerClose() {
            mockWS.close();
        },
    };

    return mockWS;
}
