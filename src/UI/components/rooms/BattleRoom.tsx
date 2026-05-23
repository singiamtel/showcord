import { type HTMLAttributes, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';

import ChatBox from '../single/Chatbox';
import UserList from '../single/UserList';
import Chat from '../single/Chat';
import { cn } from '@/lib/utils';
import BattleWindow from './battle/Battle';
import BattleControls from './battle/BattleControls';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorHandler } from '../ErrorHandler';

export default function BattleRoom(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const [userListOpen, setUserListOpen] = useState(false);

    return (
        <div
            id="big-panel"
            className={cn(
                props.className,
                'flex break-normal h-screen overflow-x-hidden',
            )}
        >
            <div className="grid grid-rows-[1fr_16rem] w-3/4 h-full gap-2 p-4 overflow-hidden">
                <div className="min-h-0 flex items-center justify-center overflow-hidden">
                    <ErrorBoundary FallbackComponent={ErrorHandler}>
                        <BattleWindow/>
                    </ErrorBoundary>
                </div>
                <div className="min-h-0 bg-gray-125 dark:bg-gray-600 rounded">
                    <ErrorBoundary FallbackComponent={ErrorHandler}>
                        <BattleControls/>
                    </ErrorBoundary>
                </div>
            </div>

            <div className="w-1/4 flex flex-col bg-gray-sidebar-light dark:bg-gray-600">
                <button
                    type="button"
                    className="border bg-gray-251 dark:bg-gray-250 z-10 p-2 m-1 rounded-xl w-10 h-10 flex justify-center items-center cursor-pointer"
                    onClick={() => {
                        setUserListOpen(!userListOpen);
                    }}
                >
                    <FontAwesomeIcon icon={faUsers} height={16} width={16} className={userListOpen ? 'text-blue-200' : 'text-gray-400'}/>
                </button>
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
                    <ChatBox className='p-2 grow'/>
                </div>

            </div>
        </div>

    );
}

