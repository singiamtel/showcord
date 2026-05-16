export function createMockUser(username: string, rank: string = '', named: boolean = true) {
    return {
        ID: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: rank ? `${rank}${username}` : username,
        rank,
        named,
    };
}

export function createMockRoom(roomId: string, type: 'chat' | 'battle' | 'pm' | 'permanent' = 'chat') {
    return {
        ID: roomId,
        type,
        name: roomId.charAt(0).toUpperCase() + roomId.slice(1),
        users: [],
        messages: [],
    };
}

export function createMockMessage(user: string, content: string, type: string = 'chat', options: Record<string, unknown> = {}) {
    return {
        user,
        content,
        type,
        timestamp: Date.now().toString(),
        ...options,
    };
}

export function createMockBattleState(roomId: string, p1: string, p2: string) {
    return {
        roomID: roomId,
        players: {
            p1: { name: p1, team: [] },
            p2: { name: p2, team: [] },
        },
        turn: 0,
        active: true,
    };
}

export function createMockFormat(id: string, name: string, section: string = '') {
    return {
        id,
        name,
        section,
    };
}
