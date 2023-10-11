import {
    ChangeEventHandler,
    createRef,
    FormEvent,
    KeyboardEventHandler,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import MiniSearch, { SearchResult } from 'minisearch';
import TextareaAutosize from 'react-textarea-autosize';
import { PS_context } from './PS_context';
import cmds from '../commands/chat_commands';

type SearchBoxOffset = {
    width: number;
    marginBottom: number;
};

const minisearch = new MiniSearch({
    fields: ['name', 'description'],
    storeFields: ['name', 'description'],
    idField: 'name',
});

// minisearch.addAll(cmds);
export default function ChatBox() {
    const [input, setInput] = useState<string>('');
    const [displaySearchbox, setDisplaySearchbox] = useState<boolean>(false);
    const [searchBoxOffset, setSearchBoxOffset] = useState<SearchBoxOffset>({
        width: 0,
        marginBottom: 0,
    });
    const { client, selectedPage: room, setRoom } = useContext(PS_context);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = createRef<HTMLFormElement>();

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!client || !room) return;
        client.send(input, room);
        setInput('');
    };

    const manageKeybinds: KeyboardEventHandler = (e) => {
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
            const prev = client.room(room)?.historyPrev();
            if (!prev) return;
            setInput(prev);
            e.preventDefault();
        }
        if (e.key === 'ArrowDown') {
            if (!room) return;
            const prev = client.room(room)?.historyNext();
            if (!prev) {
                setInput('');
            } else {
                setInput(prev);
            }
            e.preventDefault();
        }
    };

    const manageChanges: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    // if (!formRef.current?.textContent) {
    // }
        if (e.target.value.startsWith('/')) {
            // calculate vertical offset including the size of the box
            // setDisplaySearchbox(true);
        } else {
            setDisplaySearchbox(false);
        }
        setInput(e.target.value);
    };

    useEffect(() => {
        const size = formRef.current?.getBoundingClientRect();
        if (
            searchBoxOffset.width === size?.width &&
      searchBoxOffset.marginBottom === size?.height
        ) return;
        setSearchBoxOffset({
            width: size?.width || 0,
            marginBottom: size?.height || 0,
        });
    }, [formRef, searchBoxOffset.width, searchBoxOffset.marginBottom]);

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
        <>
            <div className="w-full">
                <form onSubmit={submit} ref={formRef} className="w-full">
                    <SearchBox
                        offset={searchBoxOffset}
                        display={displaySearchbox}
                        text={input}
                    />
                    <div className="flex flex-row">
                        <TextareaAutosize
                            className="mr-5 ml-5 p-2 rounded-lg flex-grow bg-gray-375 text-white resize-none placeholder-gray-175"
                            value={input}
                            onChange={manageChanges}
                            onKeyDown={manageKeybinds}
                            ref={textAreaRef}
                            placeholder={`Message ${
                                room ? client.room(room)?.name.trim() : ''
                            }`}
                        >
                        </TextareaAutosize>
                    </div>
                </form>
            </div>
        </>
    );
}

const SearchBox = (
    { offset, display, text }: {
        offset: SearchBoxOffset;
        display: boolean;
        text: string;
    },
) => {
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    useEffect(() => {
        const search = minisearch.search(text.slice(1), {
            boost: { name: 4 },
            fuzzy: 0.6,
        });
        setSuggestions(search);
    }, [text]);

    return (
        <div
            style={{
                bottom: `${offset.marginBottom}px`,
                width: `${offset.width}px`,
            }}
            className={'absolute mr-5 ml-5 mb-2 rounded-lg text-white bg-gray-600 ' +
        (display ? `` : 'hidden')}
        >
            <div>
                {suggestions.map((suggestion, idx) => (
                    <Suggestion key={idx} suggestion={suggestion} />
                ))}
            </div>
        </div>
    );
};

const Suggestion = ({ suggestion }: { suggestion: SearchResult }) => (
    <div className="flex flex-row">
        <div className="flex flex-col">
            <div className="text-white">{suggestion.name}</div>
            <div className="text-gray-400">{suggestion.description}</div>
        </div>
    </div>
);
