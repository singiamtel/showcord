import {
    Activity,
    type HTMLAttributes,
    lazy,
    Suspense,
} from 'react';

import Home from '../../Home';
import SettingsPage from '../../SettingsPage';
import { cn } from '@/lib/utils';
import { useRoomStore } from '@/client/client';
import { ErrorBoundary } from '../ErrorBoundary';
import { InfinitySpin } from 'react-loader-spinner';
import { RoomContext } from '../RoomContext';
import type { Room } from '@/client/room/room';

const ChatRoom = lazy(() => import('../rooms/ChatRoom'));
const BattleRoom = lazy(() => import('../rooms/BattleRoom'));
const PmRoom = lazy(() => import('../rooms/PmRoom'));
const HtmlRoom = lazy(() => import('../rooms/HtmlRoom'));

function RoomContent({ room, className }: Readonly<{ room: Room; className?: string }>) {
    const { type, ID } = room;
    if (type === 'permanent') {
        if (ID === 'home') return <Home className={className} />;
        if (ID === 'settings') return <SettingsPage className={className} />;
        return (
            <div className={cn(className, 'flex flex-col text-red-400')}>
                Unknown permanent room: &quot;{ID}&quot;
            </div>
        );
    }
    if (type === 'chat') return <ChatRoom className={className} />;
    if (type === 'battle') return <BattleRoom className={className} />;
    if (type === 'html') return <HtmlRoom className={className} />;
    if (type === 'pm') return <PmRoom className={className} />;

    console.error('Unknown room type:', type);
    return null;
}

export default function BigPanel(props: Readonly<HTMLAttributes<'div'>>) {
    const rooms = useRoomStore(state => state.rooms);
    const selectedRoomID = useRoomStore(state => state.selectedRoomID);
    const openRooms = Array.from(rooms.values()).filter(r => r.open);

    if (openRooms.length === 0) return null;

    return (
        <>
            {openRooms.map(room => (
                <Activity key={room.ID} mode={room.ID === selectedRoomID ? 'visible' : 'hidden'}>
                    <RoomContext value={room.ID}>
                        <ErrorBoundary
                            fallback={(error) => (
                                <div className={cn(props.className, 'flex flex-col justify-center items-center')}>
                                    <h2 className='text-xl font-bold mb-2'>Error in room: {room.ID}</h2>
                                    <p className='text-sm text-gray-600 dark:text-gray-400'>{error.message}</p>
                                </div>
                            )}
                        >
                            <Suspense fallback={
                                <div className={cn(props.className, 'flex flex-col justify-center items-center h-full')}>
                                    <InfinitySpin width="200" color="#4fa94d" />
                                </div>
                            }>
                                <RoomContent room={room} className={props.className} />
                            </Suspense>
                        </ErrorBoundary>
                    </RoomContext>
                </Activity>
            ))}
        </>
    );
}
