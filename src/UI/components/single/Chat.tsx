import {
    createRef,
    HTMLAttributes,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { useClientContext } from './ClientContext';
import useOnScreen from '../../hooks/useOnScreen';
import Html from '../../chatFormatting/Html';
import { HHMMSS } from '../../../utils/date';
import { ErrorBoundary } from 'react-error-boundary';

import Linkify from 'linkify-react';
import { Message, MessageType } from '../../../client/message';
import Code from '../../chatFormatting/code';
import { Username } from '../Username';

import { userColor } from '../../../utils/namecolour';
import manageURL from '../../../utils/manageURL';
import { assert, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useClientStore } from '@/client/client';
import { FormatMsgDisplay } from '@/UI/chatFormatting/MessageParser';

export default function Chat(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const currentRoom = useClientStore(state => state.currentRoom);
    const messages = useClientStore(state => state.messages);
    assert(currentRoom, 'Opening chat without a selected room');
    const messagesEndRef = createRef<HTMLDivElement>();
    const isIntersecting = useOnScreen(messagesEndRef);
    const ref = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (ref.current) {
            const elHeight = ref.current.offsetHeight / 2;
            ref.current.scrollTop = ref.current.scrollHeight - elHeight;
        }
    }, [ref.current]);

    useLayoutEffect(() => {
        if (isIntersecting) {
            scrollToBottom();
        }
    }, [messages]);

    useLayoutEffect(() => {
        scrollToBottom();
    }, [ref.current, currentRoom]);

    return (
        <div
            className={cn(
                'p-8 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full relative',
                props.className,
            )}
            ref={ref}
        >
            {messages[currentRoom.ID] ? messages[currentRoom.ID].map((message, index, arr) => (
                <ErrorBoundary
                    key={index}
                    fallbackRender={({ error: e }) => {
                        console.error(e.name, message.content, e);
                        return <div className="text-red-400">Error displaying message</div>;
                    }}
                >
                    <MessageComponent
                        key={index}
                        time={message.timestamp}
                        user={message.user || ''}
                        message={message.content}
                        type={message.type}
                        hld={message.hld}
                        prev={arr[index - 1]}
                        cancelled={message.cancelled}
                    />
                </ErrorBoundary>
            )) : null}
            <div className="relative h-0 w-0">
                {/* invisible div to scroll to */}
                <div
                    id="msg_end"
                    ref={messagesEndRef}
                    className="absolute right-0 top-0 h-4 w-4"
                >
                </div>
            </div>
        </div>
    );
}

/* https://linkify.js.org/docs/linkify-react.html#custom-link-components */
const options = {
    defaultProtocol: 'https',
    target: '_blank',
    attributes: {
        onClick: manageURL,
        className: 'text-blue-500 underline cursor-pointer',
    },
} as const;

export function ChallengeMessage(
    { message, user, cancelled }: Readonly<{
        message: string;
        user: string;
        cancelled?: boolean;
    }>,
) {
    const { client } = useClientContext();
    const currentRoom = useClientStore(state => state.currentRoom);


    function acceptChallenge() {
        assert(currentRoom, 'currentRoom');
        client.send('/accept', currentRoom.ID);
    }

    function cancelChallenge() {
        assert(currentRoom, 'currentRoom');
        client.send('/reject', currentRoom.ID);
    }

    const formatID = message.split('|')[0];
    const format = client.formatName(formatID) || { gen: 9, name: `Unknown(${formatID})` };
    if (cancelled) {
        return (
            <div className="p-2 bg-gray-100 rounded-md flex flex-col justify-center items-center">
                Challenge from <Username user={user} bold /> was cancelled
            </div>
        );
    }
    return (
        <div className="p-2 bg-blue-pastel rounded-md flex flex-col justify-center items-center">
            { user === client.username ? (
                <>
                    <div>Waiting for opponent to accept challenge</div>
                    <strong>
                        <span className='text-sm text-gray-125'>[Gen {format.gen}]</span> {format.name}
                    </strong>
                </>
            ) :
                <>
                    <div>You received a challenge from <Username user={user} bold /></div>
                    <strong>
                        <span className='text-sm text-gray-125'>[Gen {format.gen}]</span> {format.name}
                    </strong>
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                acceptChallenge();
                            }}
                        >Accept</Button>

                        <Button
                            variant="secondary"
                            onClick={() => {
                                cancelChallenge();
                            }}
                        >Decline</Button>
                    </div>
                </>
            }
        </div>
    );
}

export function MessageComponent(
    { message, user, type, time, hld, prev, cancelled }: Readonly<{
        message: string;
        user: string;
        type: MessageType;
        time?: Date;
        hld?: boolean | null;
        prev?: Message;
        cancelled?: boolean;
    }>,
) {
    if (type === 'boxedHTML') {
        return <Html message={message} />;
    }
    if (type === 'rawHTML') {
        if (prev?.content.startsWith('!code')) {
            return <Code message={message} />;
        }
        return <span className='pt-0.5'><Html message={message} raw /></span>;
    }
    if (type === 'simple') {
        return message ?
            (
                <div>
                    {' ' + message}
                </div>
            ) :
            null;
    }
    if (type === 'error') {
        return (
            <div className="pt-0.5 text-red-400">
                <span className="text-gray-125 text-xs">
                    {time ? HHMMSS(time) : ''}

          &nbsp;
                </span>
                {' ' + message}
            </div>
        );
    }
    if (type === 'challenge') {
        return <ChallengeMessage message={message} user={user} cancelled={cancelled} />;
    }
    if (type === 'log') {
        return (
            <div className="pt-0.5 ">
                <span className="text-gray-125 text-xs">
                    {time ? HHMMSS(time) : ''}
                </span>
                <Linkify options={options}>
                    {' ' + message}
                </Linkify>
            </div>
        );
    }
    return (
        <div
            className={cn('px-1',
                (hld ? 'bg-yellow-hl-body-light dark:bg-yellow-hl-body' : ''))}
        >
            <span className="text-gray-125 text-xs">
                {time ? HHMMSS(time) : ''}
            </span>
            <span className="break-words">
        &nbsp;
                {type === 'roleplay' ?
                    (
                        <>
                            <span style={{ backgroundColor: userColor(user), width: '.35em', height: '.35em', verticalAlign: 'middle' }} className='mr-1 align-center inline-block rounded-full m-auto'>
                            </span>
                            <Username
                                user={user}
                                colorless
                            />
                            <em>
                                <FormatMsgDisplay msg={message} />
                            </em>
                        </>
                    ) :
                    (
                        <>
                            <Username
                                user={user}
                                colon
                                bold
                            />&nbsp;
                            {
                                type === 'announce' ?
                                    <span className="bg-blue-400 text-white rounded p-1">
                                        <FormatMsgDisplay msg={message.trim()} />
                                    </span> :
                                    <FormatMsgDisplay msg={message} />
                            }
                        </>
                    )}
            </span>
        </div>
    );
}
