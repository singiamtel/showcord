import { toID } from '../utils/generic';
import { Room } from './room/room';
import { useClientStore } from './clientStore';
import type { Settings } from './settings';
import type { RoomNotification as RoomNotifications } from './notifications';

export interface RoomManagementCallbacks {
    getRoom: (roomID: string) => Room | undefined;
    getRooms: () => Map<Room['ID'], Room>;
    getSelectedRoom: () => string;
}

export function addRoom(
    room: Room,
    settings: Settings,
    callbacks: { getRoom: (roomID: string) => Room | undefined }
) {
    useClientStore.getState().addRoom(room);
    if (!settings.rooms.find((r) => r.ID === room.ID)?.open) {
        selectRoom(room.ID, callbacks.getRoom);
    }
    if (room.type !== 'permanent' && !settings.rooms.find((r) => r.ID === room.ID)) {
        settings.addRoom(room);
    }
}

export function openRoom(
    roomID: string,
    getRooms: () => Map<Room['ID'], Room>,
    getRoom: (roomID: string) => Room | undefined,
    settings: Settings
) {
    const room = getRoom(roomID);
    if (room) {
        room.open = true;
        const rooms = getRooms();
        rooms.set(roomID, room);
        settings.changeRooms(rooms);
        useClientStore.getState().setRooms(rooms);
        return;
    }
    console.warn('openRoom: room (' + roomID + ') is unknown');
}

export function removeRoom(
    roomID: string,
    selectedRoom: string,
    getRoom: (roomID: string) => Room | undefined,
    settings: Settings
) {
    if (roomID === selectedRoom) {
        selectRoom('home', getRoom);
    }
    useClientStore.getState().removeRoom(roomID);
    settings.removeRoom(roomID);
}

export function closeRoom(
    roomID: string,
    getRooms: () => Map<Room['ID'], Room>,
    getRoom: (roomID: string) => Room | undefined,
    selectedRoom: string
) {
    const room = getRoom(roomID);
    if (!room) {
        console.warn('Trying to close non-existent room', roomID);
        return;
    }
    room.open = false;
    const rooms = getRooms();
    rooms.set(roomID, room);
    useClientStore.getState().setRooms(rooms);
    if (roomID === selectedRoom) {
        selectRoom('home', getRoom);
    }
}

export function createPM(user: string, callbacks: RoomManagementCallbacks) {
    __createPM(user, callbacks.getRoom);
    selectRoom('pm-' + toID(user), callbacks.getRoom);
}

export function __createPM(user: string, getRoom: (roomID: string) => Room | undefined) {
    const roomID = `pm-${toID(user)}`;
    const room = getRoom(roomID);
    if (room) {
        return;
    }
    const newRoom = new Room({
        ID: roomID,
        name: user,
        type: 'pm',
        connected: false,
        open: true,
    });
    useClientStore.getState().addRoom(newRoom);
}

export function selectRoom(roomid: string, getRoom: (roomID: string) => Room | undefined) {
    getRoom(roomid)?.select();
    useClientStore.setState({ currentRoom: getRoom(roomid), selectedRoomID: roomid });
    useClientStore.getState().clearNotifications(roomid);
}

export function getRoomsArray(getRooms: () => Map<Room['ID'], Room>): Room[] {
    const tmp = [...getRooms().values()].filter((r) => r.open);
    return tmp;
}

export function createPermanentRooms(permanentRooms: readonly { ID: string; name: string; defaultOpen: boolean }[]) {
    permanentRooms.forEach((room) => {
        useClientStore.getState().addRoom(
            new Room({
                ID: room.ID,
                name: room.name,
                type: 'permanent',
                connected: false,
                open: room.defaultOpen,
            }),
        );
    });
}

export function getNotifications(getRooms: () => Map<Room['ID'], Room>): Map<string, RoomNotifications> {
    return new Map(
        [...getRooms()].map(([roomID, room]) => [roomID, { unread: room.unread, mentions: room.mentions }]),
    );
}

export function clearNotifications(roomID: string, getRoom: (roomID: string) => Room | undefined) {
    const room = getRoom(roomID);
    if (room) {
        room.clearNotifications();
        useClientStore.getState().clearNotifications(roomID);
    }
}
