import {
    createRef,
    Fragment,
    MouseEvent,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
} from 'react';
import { PS_context } from '../PS_context';
import useOnScreen from '../hooks/isOnScreen';
import HTML from '../formatting/html';
import { HHMMSS } from '../../utils/date';
import { ErrorBoundary } from 'react-error-boundary';

import Linkify from 'linkify-react';
import { Message } from '../../client/message';
import Code from '../formatting/code';
import { UserCard, UsernameComponent } from '../usercomponents';

import {
    bold,
    fakeCommand,
    greentext,
    inlineCode,
    italic,
    link,
    roomLink,
    spoiler,
    strikethrough,
    subscript,
    superscript,
} from '../formatting/chat';
import { userColor } from '../../utils/namecolour';
import manageURL from '../../utils/manageURL';

// ``code here`` marks inline code
// ||text|| are spoilers
// **text** is bold
// __text__ is italic
// ~~text~~ is strikethrough
// ^^text^^ is superscript
// \\text\\ is subscript
// [[text]] is a link
// >text is greentext
// /me is an emote

const tokens = {
    '`': 'code',
    '|': 'spoiler',
    '*': 'bold',
    '_': 'italic',
    '~': 'strikethrough',
    '^': 'superscript',
    '\\': 'subscript',
    '[': 'link',
    '>': 'greentext',
    '<': 'roomlink',
    '/': 'fakeCommand',
} as const;

type Token = typeof tokens[keyof typeof tokens];

const elements: {
    [key in Token]: {
        pattern: RegExp;
        element: (props: any) => JSX.Element;
    };
} = {
    code: { pattern: /``(.+?)``/g, element: inlineCode },
    spoiler: { pattern: /\|\|(.+?)\|\|/g, element: spoiler },
    bold: { pattern: /\*\*(.+?)\*\*/g, element: bold },
    italic: { pattern: /__(.+?)__/g, element: italic },
    strikethrough: { pattern: /~~(.+?)~~/g, element: strikethrough },
    superscript: { pattern: /\^\^(.+?)\^\^/g, element: superscript },
    subscript: { pattern: /\\\\(.+?)\\\\/g, element: subscript },
    link: { pattern: /\[\[(.+?)?\]\]/g, element: link },
    greentext: { pattern: /^>.*/g, element: greentext },
    fakeCommand: { pattern: /^\/\/.*/g, element: fakeCommand },
    roomlink: { pattern: /<<(.+?)?>>/g, element: roomLink },
} as const;

const cleanTag = (input: string, tag: keyof typeof elements) => {
    switch (tag) {
        case 'code':
            return input.replace(elements.code.pattern, '$1');
        case 'spoiler':
            return input.replace(elements.spoiler.pattern, '$1');
        case 'bold':
            return input.replace(elements.bold.pattern, '$1');
        case 'italic':
            return input.replace(elements.italic.pattern, '$1');
        case 'strikethrough':
            return input.replace(elements.strikethrough.pattern, '$1');
        case 'superscript':
            return input.replace(elements.superscript.pattern, '$1');
        case 'subscript':
            return input.replace(elements.subscript.pattern, '$1');
        case 'link':
            return input.replace(elements.link.pattern, '$1');
        case 'greentext':
        case 'fakeCommand': // e.g. //help should display as /help
            return input?.slice(1);
        case 'roomlink':
            return input.replace(elements.roomlink.pattern, '$1');
        default:
            console.error('cleanTag: unknown tag', tag);
            return '';
    }
};

let deepKey = 0;
const encloseInTag = (
    input: string,
    tag: keyof typeof elements,
): false | { length: number; element: JSX.Element } => {
    // Find the closing tag if it exists
    elements[tag].pattern.lastIndex = 0;
    const matches = elements[tag].pattern.exec(input);
    if (matches) {
        return {
            length: matches[0].length,
            element: elements[tag].element({
                children: FormatMsgDisplay({
                    msg: cleanTag(matches[0], tag),
                    recursed: true,
                }),
                key: deepKey++,
            }),
        };
    }
    return false;
};

export function FormatMsgDisplay(
    { msg, recursed = false }: { msg: string; recursed?: boolean },
) {
    if (!msg) return <>{msg}</>;
    const jsxElements = [];
    let currentString = '';
    for (let i = 0; i < msg.length; i++) {
        const char = msg[i];
        if (char in tokens) {
            const tag = tokens[char as keyof typeof tokens];
            if ((char === '>' || char === '/') && i !== 0) {
                currentString += char;
                continue;
            }
            const result = encloseInTag(msg.slice(i), tag);
            if (result) {
                i += result.length - 1;
                if (currentString) {
                    if (recursed) {
                        jsxElements.push(
                            <Fragment key={deepKey++}>{currentString}</Fragment>,
                        );
                    } else {
                        jsxElements.push(
                            <Linkify options={options} key={deepKey++}>
                                {currentString}
                            </Linkify>,
                        );
                    }
                    currentString = '';
                }
                jsxElements.push(result.element);
            } else {
                currentString += msg[i];
            }
        } else {
            currentString += msg[i];
        }
    }
    if (currentString) {
        if (recursed) {
            jsxElements.push(
                <Fragment key={deepKey++}>{currentString}</Fragment>,
            );
        } else {
            jsxElements.push(
                <Linkify options={options} key={deepKey++}>
                    {currentString}
                </Linkify>,
            );
        }
    }
    return <>{jsxElements}</>;
}

export default function Chat({
    setUser,
    username,
    user,
    position,
    wrapperRef,
    closeWindow,
    clickUsername,
}: {
    setUser: (user: any) => void;
    username: string | null;
    setUsername: (username: string) => void;
    setPosition: (position: { x: number; y: number }) => void;
    user: any | null;
    position: { x: number; y: number };
    wrapperRef: React.MutableRefObject<any>;
    closeWindow: () => void;
    clickUsername: (e: MouseEvent) => void;
}) {
    const { messages, selectedPage } = useContext(PS_context);
    const messagesEndRef = createRef<HTMLDivElement>();
    const isIntersecting = useOnScreen(messagesEndRef);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current!.scrollIntoView({ behavior: 'auto' });
    }, [messagesEndRef]);

    useLayoutEffect(() => {
        if (isIntersecting) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        setUser(null);
    }, [selectedPage]);

    return (
        <div className="p-5 flex flex-col overflow-auto overflow-x-hidden break-words overflow-y-scroll h-full relative ">
            {username ?
                (
                    <UserCard
                        user={user}
                        name={username}
                        position={position}
                        forwardRef={wrapperRef}
                        close={closeWindow}
                    />
                ) :
                null}
            {messages.map((message, index, arr) => (
                <ErrorBoundary
                    key={index}
                    fallbackRender={({ error: e }) => {
                        console.error('Error', e.name, message.content);
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
                        onNameClick={clickUsername}
                    />
                </ErrorBoundary>
            ))}
            <div className="relative h-0 w-0">
                {/* invisible div to scroll to */}
                <div
                    id="msg_end"
                    ref={messagesEndRef}
                    className="absolute right-0 top-0 h-4 w-4"
                >
                </div>
            </div>
            {' '}
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
};

export function MessageComponent(
    { message, user, type, time, hld, prev, onNameClick }: {
        message: string;
        user: string;
        type: string;
        time?: Date;
        hld?: boolean;
        prev?: Message;
        onNameClick?: (e: MouseEvent) => void;
    },
) {
    if (type === 'raw') {
        if (prev?.content.startsWith('!code')) {
            return <Code message={message} />;
        }
        return <HTML message={message} />;
    }
    if (type === 'simple') {
        return message ?
            (
                <div className="text-white">
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
    if (type === 'log') {
        return (
            <div className="pt-0.5 text-white">
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
        <div className={'pt-0.5 ' + (hld ? 'bg-yellow-hl-body' : '')}>
            <span className="text-gray-125 text-xs">
                {time ? HHMMSS(time) : ''}
            </span>
            <span className="text-white break-words">
        &nbsp;
                {type === 'roleplay' ?
                    (
                        <>
                            <strong style={{ color: userColor(user) }}>
                ●
                            </strong>{' '}
                            <UsernameComponent
                                user={user}
                                onClick={(e) => onNameClick && onNameClick(e)}
                                colorless
                            />
                            <em>
                                <FormatMsgDisplay msg={message} />
                            </em>
                        </>
                    ) :
                    (
                        <>
                            <UsernameComponent
                                user={user}
                                onClick={(e) => onNameClick && onNameClick(e)}
                                colon
                                bold
                            />&nbsp;
                            <FormatMsgDisplay msg={message} />
                        </>
                    )}
            </span>
        </div>
    );
}
