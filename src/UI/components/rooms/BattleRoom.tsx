import { HTMLAttributes, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';

import ChatBox from '../single/Chatbox';
import UserList from '../single/UserList';
import Chat from '../single/Chat';
import { cn } from '@/lib/utils';
import BattleWindow from './battle/Battle';
import BattleControls from './battle/BattleControls';
import Calcs from './battle/Calcs';

export default function BattleRoom(props: HTMLAttributes<HTMLDivElement>) {
    const [userListOpen, setUserListOpen] = useState(false);

    return (
        <div
            id="big-panel"
            className={cn(
                props.className,
                'flex break-normal h-screen overflow-x-hidden',
            )}
        >
            <div className="flex flex-col w-3/4 justify-center items-center gap-8 p-8">
                <BattleWindow/>
                <BattleControls/>
                <Calcs/>
            </div>

            <div className="w-1/4 flex flex-col bg-gray-sidebar-light dark:bg-gray-600">
                <div
                    className="border bg-gray-251 dark:bg-gray-250 z-10 p-2 m-1 rounded-xl w-10 h-10 flex justify-center items-center cursor-pointer"
                    onClick={() => {
                        setUserListOpen(!userListOpen);
                    }}
                >
                    <FontAwesomeIcon icon={faUsers} height={16} width={16} className={userListOpen ? 'text-blue-200' : 'text-gray-400'}/>
                </div>
                <div
                    className="dark:bg-gray-300 flex flex-col min-h-0 h-full w-full max-w-full"
                >
                    <AnimatePresence initial={false} mode="wait">
                        {userListOpen &&
                        <motion.div
                            initial={
                                {
                                    height: 0,
                                    opacity: 0,
                                }}
                            animate={
                                {
                                    height: 'fit-content',
                                    opacity: 1,
                                    transition: {
                                        height: {
                                            duration: 0.3,
                                        },
                                        opacity: {
                                            duration: 0.15,
                                            delay: 0.15,
                                        },
                                    },
                                }
                            }
                            exit={{
                                height: 0,
                                opacity: 0,
                                transition: {
                                    height: {
                                        duration: 0.3,
                                    },
                                    opacity: {
                                        duration: 0.15,
                                    },
                                },
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <UserList />
                        </motion.div>
                        }
                    </AnimatePresence>
                    <Chat className='p-2 h-full'/>
                    <ChatBox className='p-2 flex-grow-1'/>
                </div>

            </div>
        </div>

    );
}

