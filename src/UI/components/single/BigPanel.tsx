import {
    HTMLAttributes,
    useContext,
} from 'react';

import { PS_context } from './PS_context';
import UserList from './UserList';

import ChatBox from './chatbox';
import Chat from './chat';
import Home from '../../Home';
import SettingsPage from '../../SettingsPage';
import { cn } from '@/lib/utils';
import ChatRoom from '../rooms/ChatRoom';
import BattleRoom from '../rooms/BattleRoom';
import PmRoom from '../rooms/PmRoom';
import HtmlRoom from '../rooms/HtmlRoom';

export default function BigPanel(props: Readonly<HTMLAttributes<'div'>>) {
    const { selectedPage: room, rooms } = useContext(PS_context);
    const roomType = rooms?.find((r) => r.ID === room)?.type;

    if (!room) return null;
    if (roomType === 'permanent') {
        if (room === 'home') {
            return <Home className={props.className} />;
        }
        if (room === 'settings') {
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
                <div className="h-[90%] max-h-[90%] flex-grow flex-shrink min-h-0">
                    <Chat
                    />
                </div>
                <div className="flex-grow">
                    <ChatBox />
                </div>
            </div>
        </div>
    );
}
