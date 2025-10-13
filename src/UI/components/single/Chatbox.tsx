import {
    type ChangeEventHandler,
    type FormEvent,
    type HTMLAttributes,
    type KeyboardEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import MiniSearch, { type SearchResult } from 'minisearch';
import TextareaAutosize from 'react-textarea-autosize';
import { cn } from '@/lib/utils';
import { useClientContext } from './useClientContext';
import { useRoomStore } from '@/client/client';

type SearchBoxOffset = {
    width: number;
    marginBottom: number;
};

const minisearch = new MiniSearch({
    fields: ['name', 'description'],
    storeFields: ['name', 'description'],
    idField: 'name',
});

// minisearch.addAll(cmds); // Disabled for now

export default function ChatBox(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const [input, setInput] = useState<string>('');
    const [cursorPos, setCursorPos] = useState(input.length);
    const [displaySearchbox, setDisplaySearchbox] = useState<boolean>(false);
    const [searchBoxOffset, setSearchBoxOffset] = useState<SearchBoxOffset>({
        width: 0,
        marginBottom: 0,
    });
    const room = useRoomStore(state => state.currentRoom);
    const { client, setRoom } = useClientContext();
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!client || !room) return;
        client.send(input, room.ID);
        setInput('');
    };

    const manageKeybinds = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // if user pressed enter, submit form
    // don't submit if user pressed shift+enter
        if (e.key === 'Enter' && !e.shiftKey) {
            if (!formRef.current?.textContent) {
                return;
            }
            // submit form
            formRef.current?.requestSubmit();
            e.preventDefault();
            setDisplaySearchbox(false);
            return;
        }
        if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'ArrowRight') {
            if (!formRef.current?.textContent) {
                setRoom(1);
                e.preventDefault();
                return;
            }
        }
        if (e.key === 'Tab' && !e.shiftKey && e.currentTarget.value && room) {
            e.preventDefault();

            const users = room?.users;
            if (!users) return;

            const { selectionStart: cursorPos, value: text } = e.currentTarget;
            const textBeforeCursor = text.slice(0, cursorPos);
            const textAfterCursor = text.slice(cursorPos);
            const partsBeforeCursor = textBeforeCursor.split(/\b/);
            const lastWordBeforeCursor = partsBeforeCursor.pop();
            if (!lastWordBeforeCursor) return;

            const user = users.find(user => user.name.slice(1).toLowerCase().startsWith(lastWordBeforeCursor.toLowerCase()));
            if (!user) return;

            const userNameWithoutRank = user.name.slice(1);
            setInput(partsBeforeCursor.concat([userNameWithoutRank]).join('') + textAfterCursor);
            setCursorPos(cursorPos + userNameWithoutRank.length - lastWordBeforeCursor.length);
            return;
        }
        if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowLeft') {
            if (!formRef.current?.textContent) {
                setRoom(-1);
                e.preventDefault();
                return;
            }
        }
        // Chat history works like a shell
        if (e.key === 'ArrowUp') {
            // Previous message in history
            if (!room) return;
            const prev = room.historyPrev();
            if (!prev) return;
            setInput(prev);
            e.preventDefault();
        }
        if (e.key === 'ArrowDown') {
            if (!room) return;
            const prev = room.historyNext();
            if (!prev) {
                setInput('');
            } else {
                setInput(prev);
            }
            e.preventDefault();
        }
    };

    useLayoutEffect(() => {
        if (!textAreaRef.current) return;
        textAreaRef.current.setSelectionRange(cursorPos, cursorPos);
    }, [cursorPos, textAreaRef]);

    const manageChanges: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        if (e.target.value.startsWith('/')) {
            // setDisplaySearchbox(true); // Disabled for now
        } else {
            setDisplaySearchbox(false);
        }
        setInput(e.target.value);
    };

    useLayoutEffect(() => {
        const size = formRef.current?.getBoundingClientRect();
        setSearchBoxOffset(prev => {
            if (
                prev.width === size?.width &&
                prev.marginBottom === size?.height
            ) return prev;
            return {
                width: size?.width ?? 0,
                marginBottom: size?.height ?? 0,
            };
        });
    }, [displaySearchbox]);

    useEffect(() => {
        textAreaRef.current?.focus();
    }, [room]);

    useEffect(() => {
        const focus = () => {
            textAreaRef.current?.focus();
        };
        focus();
        window.addEventListener('focus', focus);
        return () => {
            window.removeEventListener('focus', focus);
        };
    }, []);

    return (
        <div className={cn(props.className, 'w-full m-2 mt-0')}>
            <form onSubmit={submit} ref={formRef} className="w-full">
                <SearchBox
                    offset={searchBoxOffset}
                    display={displaySearchbox}
                    text={input}
                />
                <div className="flex flex-row">
                    <TextareaAutosize
                        className="mr-5 ml-5 p-2 rounded-lg flex-grow bg-gray-376 dark:bg-gray-375 resize-none placeholder-gray-175"
                        value={input}
                        onChange={manageChanges}
                        onKeyDown={manageKeybinds}
                        ref={textAreaRef}
                        placeholder={`Message ${
                            room ? room.name.trim() : ''
                        }`}
                    >
                    </TextareaAutosize>
                </div>
            </form>
        </div>
    );
}

const SearchBox = (
    { offset, display, text }: Readonly<{
        offset: SearchBoxOffset;
        display: boolean;
        text: string;
    }>,
) => {
    const suggestions = text ?
        minisearch.search(text.slice(1), {
            boost: { name: 4 },
            fuzzy: 0.6,
        }) :
        [];

    return (
        <div
            style={{
                bottom: `${offset.marginBottom}px`,
                width: `${offset.width}px`,
            }}
            className={'absolute mr-5 ml-5 mb-2 rounded-lg text-white bg-gray-601 dark:bg-gray-600 ' +
        (display ? `` : 'hidden')}
        >
            <div>
                {suggestions.map((suggestion) => (
                    <Suggestion key={suggestion.id} suggestion={suggestion} />
                ))}
            </div>
        </div>
    );
};

const Suggestion = ({ suggestion }: Readonly<{ suggestion: SearchResult }>) => (
    <div className="flex flex-row">
        <div className="flex flex-col">
            <div className="text-white">{suggestion.name}</div>
            <div className="text-gray-400">{suggestion.description}</div>
        </div>
    </div>
);
