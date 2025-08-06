import type {
    HTMLAttributes,
} from 'react';

import { useClientContext } from './ClientContext';

import ChatBox from './Chatbox';
import Chat from './Chat';
import Home from '../../Home';
import SettingsPage from '../../SettingsPage';
import { cn } from '@/lib/utils';
import ChatRoom from '../rooms/ChatRoom';
import BattleRoom from '../rooms/BattleRoom';
import PmRoom from '../rooms/PmRoom';
import HtmlRoom from '../rooms/HtmlRoom';
import { useClientStore } from '@/client/client';
import { ErrorBoundary } from 'react-error-boundary';

export default function BigPanel(props: Readonly<HTMLAttributes<'div'>>) {
    const room = useClientStore(state => state.currentRoom);
    const roomType = room?.type;

    if (!room) return null;
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
    return (
        <div
            id="big-panel"
            className={cn(
                props.className,
                'flex break-normal h-screen',
            )}
        >
            <div className={'dark:bg-gray-300 flex flex-col w-full max-w-full'}>
                <div className="flex-grow flex-shrink min-h-0">
                    <ErrorBoundary fallbackRender={({ error: e }) => {
                        console.error(e);
                        return <div className="text-red-400">Error displaying messages</div>;
                    }}>
                        <Chat />
                    </ErrorBoundary>
                </div>
                <div className="flex-grow">
                    <ChatBox className='p-2' />
                </div>
            </div>
        </div>
    );
}
