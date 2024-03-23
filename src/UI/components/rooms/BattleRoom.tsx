import ChatBox from '../single/chatbox';
import UserList from '../single/UserList';
import Chat from '../single/chat';
import { cn } from '@/lib/utils';
import { HTMLAttributes, useState } from 'react';
import BattleWindow from './battle/Battle';
import BattleControls from './battle/BattleControls';
import Calcs from './battle/Calcs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentAlt, faUsers } from '@fortawesome/free-solid-svg-icons';

export default function BattleRoom(props: HTMLAttributes<HTMLDivElement>) {
    const [userListOpen, setUserListOpen] = useState(false);
    return (
        <div
            id="big-panel"
            className={cn(
                props.className,
                'flex break-normal h-screen',
            )}
        >
            <div className="flex flex-col w-3/4">
                <BattleWindow/>
                <BattleControls/>
                <Calcs/>
            </div>

            <div className="w-1/4 max-h-screen flex flex-col h-screen bg-gray-sidebar-light dark:bg-gray-600">
                <div
                    className="border bg-gray-251 dark:bg-gray-250 z-10 p-2 m-1 rounded-xl w-10 h-10 flex justify-center items-center cursor-pointer"
                    onClick={() => {
                        console.log('clicked');
                        setUserListOpen(!userListOpen);
                    }}
                >
                    {
                        userListOpen ?
                            <FontAwesomeIcon icon={faCommentAlt} height={16} width={16} /> :
                            <FontAwesomeIcon icon={faUsers} height={16} width={16} />
                    }

                </div>
                {
                    userListOpen ?
                        <UserList /> :
                        <div id="here" className="dark:bg-gray-300 flex flex-col min-h-0 w-full max-w-full">
                            <Chat className='p-2'
                            />
                            <ChatBox />
                        </div>
                }
            </div>
        </div>

    );
}

