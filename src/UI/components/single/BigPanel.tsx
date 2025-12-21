import {
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

const ChatRoom = lazy(() => import('../rooms/ChatRoom'));
const BattleRoom = lazy(() => import('../rooms/BattleRoom'));
const PmRoom = lazy(() => import('../rooms/PmRoom'));
const HtmlRoom = lazy(() => import('../rooms/HtmlRoom'));

export default function BigPanel(props: Readonly<HTMLAttributes<'div'>>) {
    const room = useRoomStore(state => state.currentRoom);
    const roomType = room?.type;

    if (!room) return null;

    const renderRoom = () => {
        if (roomType === 'permanent') {
            if (room.ID === 'home') {
                return <Home className={props.className} />;
            }
            if (room.ID === 'settings') {
                return <SettingsPage className={props.className} />;
            } else {
                return (
                    <div className={cn(props.className, 'flex flex-col text-red-400')}>
              Unknown room type: "{roomType}"
                    </div>
                );
            }
        }

        if (roomType === 'chat') {
            return <ChatRoom className={props.className}/>;
        }
        if (roomType === 'battle') {
            return <BattleRoom className={props.className}/>;
        }
        if (roomType === 'html') {
            return <HtmlRoom className={props.className}/>;
        }
        if (roomType === 'pm') {
            return <PmRoom className={props.className}/>;
        }

        // fallback, should never be reached
        console.error('Unknown room type:', roomType);
        return null;
    };

    return (
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
                {renderRoom()}
            </Suspense>
        </ErrorBoundary>
    );
}
