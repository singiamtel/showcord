import {
    type ChangeEventHandler,
    type FormEvent,
    type HTMLAttributes,
    type KeyboardEvent,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { cn } from '@/lib/utils';
import { useClientContext } from './useClientContext';
import { useRoomStore } from '@/client/client';
import { useRoomID } from '@/UI/components/RoomContext';

type SearchBoxOffset = {
    width: number;
    marginBottom: number;
};

// Session-level cache: prefix → command list
const cmdsearchCache = new Map<string, string[]>();

// Local commands with optional subcommands. These are merged with server results.
const LOCAL_COMMANDS = ['/part', '/join', '/me', '/highlight', '/hl', '/timer'];
const SUBCOMMANDS: Record<string, string[]> = {
    '/highlight': ['add', 'roomadd', 'delete', 'roomdelete', 'list', 'roomlist', 'clear', 'roomclear'],
    '/hl': ['add', 'roomadd', 'delete', 'roomdelete', 'list', 'roomlist', 'clear', 'roomclear'],
};

// Returns the subcommand prefix if the input is in subcommand context, else null.
// e.g. "/highlight ro" → "/highlight "
function getSubcmdPrefix(input: string): string | null {
    for (const cmd of Object.keys(SUBCOMMANDS)) {
        if (input.startsWith(cmd + ' ')) return cmd + ' ';
    }
    return null;
}

function fuzzyScore(str: string, pat: string): number | null {
    if (pat === '') return 0;
    if (str.startsWith(pat)) return 3 + 1 / str.length;
    if (str.includes(pat)) return 2;
    let pi = 0;
    for (let si = 0; si < str.length && pi < pat.length; si++) {
        if (str[si] === pat[pi]) pi++;
    }
    return pi === pat.length ? 1 : null;
}

function filterCmds(cmds: string[], input: string): string[] {
    if (!input.startsWith('/') || input.length <= 1) return cmds;
    const pat = input.slice(1).toLowerCase();
    return cmds
        .map(cmd => ({ cmd, score: fuzzyScore(cmd.slice(1).toLowerCase(), pat) }))
        .filter((x): x is { cmd: string; score: number } => x.score !== null)
        .sort((a, b) => b.score - a.score)
        .map(x => x.cmd);
}

function filterSubcmds(subcmds: string[], query: string): string[] {
    if (query === '') return subcmds;
    const pat = query.toLowerCase();
    return subcmds
        .map(s => ({ s, score: fuzzyScore(s.toLowerCase(), pat) }))
        .filter((x): x is { s: string; score: number } => x.score !== null)
        .sort((a, b) => b.score - a.score)
        .map(x => x.s);
}

export default function ChatBox(props: Readonly<HTMLAttributes<HTMLDivElement>>) {
    const [input, setInput] = useState<string>('');
    const [cursorPos, setCursorPos] = useState(input.length);
    // Raw candidates for the current completion context
    const [cmdSuggestions, setCmdSuggestions] = useState<string[]>([]);
    // When non-null we're completing a subcommand; this is the prefix to prepend on accept
    const [subCmdPrefix, setSubCmdPrefix] = useState<string | null>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    const [searchBoxOffset, setSearchBoxOffset] = useState<SearchBoxOffset>({
        width: 0,
        marginBottom: 0,
    });
    const roomID = useRoomID();
    const room = useRoomStore(state => state.rooms.get(roomID));
    const { client, setRoom } = useClientContext();
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const prevOffsetRef = useRef<SearchBoxOffset>({ width: 0, marginBottom: 0 });

    const filtered = cmdSuggestions.length > 0 ?
        subCmdPrefix !== null ?
            filterSubcmds(cmdSuggestions, input.slice(subCmdPrefix.length)) :
            filterCmds(cmdSuggestions, input) :
        [];

    const clearSuggestions = useCallback(() => {
        setCmdSuggestions([]);
        setSubCmdPrefix(null);
        setSelectedSuggestion(0);
    }, []);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!client || !room || !input.trim()) return;
        client.send(input, room.ID);
        setInput('');
        clearSuggestions();
    };

    const acceptSuggestion = useCallback((suggestion: string) => {
        setInput((subCmdPrefix ?? '') + suggestion + ' ');
        clearSuggestions();
        textAreaRef.current?.focus();
    }, [subCmdPrefix, clearSuggestions]);

    const fetchCmdsearch = useCallback(async (prefix: string) => {
        const cached = cmdsearchCache.get(prefix);
        const serverResults: string[] = cached ?? await (async () => {
            try {
                const results = await client.queryCmdsearch(prefix);
                cmdsearchCache.set(prefix, results);
                return results;
            } catch (_e) {
                return [];
            }
        })();
        // Merge local commands, deduplicating by name
        const merged = [...serverResults];
        for (const cmd of LOCAL_COMMANDS) {
            if (!merged.includes(cmd)) merged.push(cmd);
        }
        setSubCmdPrefix(null);
        setCmdSuggestions(merged);
        setSelectedSuggestion(0);
    }, [client]);

    const openSubcmds = useCallback((prefix: string) => {
        const subcmds = SUBCOMMANDS[prefix.trimEnd()];
        if (!subcmds) return;
        setSubCmdPrefix(prefix);
        setCmdSuggestions(subcmds);
        setSelectedSuggestion(0);
    }, []);

    const manageKeybinds = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (filtered.length > 0) {
                acceptSuggestion(filtered[selectedSuggestion]);
                return;
            }
            if (!input.trim()) return;
            formRef.current?.requestSubmit();
            return;
        }

        if (e.key === 'Escape') {
            if (filtered.length > 0) {
                e.preventDefault();
                clearSuggestions();
                return;
            }
        }

        if (e.key === 'ArrowUp') {
            if (filtered.length > 0) {
                e.preventDefault();
                setSelectedSuggestion(i => (i - 1 + filtered.length) % filtered.length);
                return;
            }
            if (!room) return;
            const prev = room.historyPrev();
            if (!prev) return;
            setInput(prev);
            e.preventDefault();
            return;
        }

        if (e.key === 'ArrowDown') {
            if (filtered.length > 0) {
                e.preventDefault();
                setSelectedSuggestion(i => (i + 1) % filtered.length);
                return;
            }
            if (!room) return;
            const prev = room.historyNext();
            setInput(prev ?? '');
            e.preventDefault();
            return;
        }

        if ((e.key === 'Tab' && !e.shiftKey) || e.key === 'ArrowRight') {
            if (!formRef.current?.textContent) {
                setRoom(1);
                e.preventDefault();
                return;
            }
        }

        if (e.key === 'Tab' && !e.shiftKey && e.currentTarget.value) {
            e.preventDefault();

            if (filtered.length > 0) {
                // Cycle forward through filtered suggestions
                setSelectedSuggestion(i => (i + 1) % filtered.length);
                return;
            }

            const value = e.currentTarget.value;
            // Subcommand context: e.g. "/highlight " or "/hl ro"
            const scPrefix = getSubcmdPrefix(value);
            if (scPrefix) {
                openSubcmds(scPrefix);
                return;
            }
            // Top-level command prefix: e.g. "/hi"
            if (value.startsWith('/') && !value.includes(' ')) {
                void fetchCmdsearch(value);
                return;
            }

            // Username completion
            const users = room?.users;
            if (!users) return;
            const { selectionStart: cursorPosVal, value: text } = e.currentTarget;
            const textBeforeCursor = text.slice(0, cursorPosVal);
            const textAfterCursor = text.slice(cursorPosVal);
            const partsBeforeCursor = textBeforeCursor.split(/\b/);
            const lastWordBeforeCursor = partsBeforeCursor.pop();
            if (!lastWordBeforeCursor) return;
            const user = users.find(u => u.name.slice(1).toLowerCase().startsWith(lastWordBeforeCursor.toLowerCase()));
            if (!user) return;
            const userNameWithoutRank = user.name.slice(1);
            setInput(partsBeforeCursor.concat([userNameWithoutRank]).join('') + textAfterCursor);
            setCursorPos(cursorPosVal + userNameWithoutRank.length - lastWordBeforeCursor.length);
            return;
        }

        if ((e.key === 'Tab' && e.shiftKey) || e.key === 'ArrowLeft') {
            if (!formRef.current?.textContent) {
                setRoom(-1);
                e.preventDefault();
                return;
            }
        }

        if (e.key === 'Tab' && e.shiftKey && filtered.length > 0) {
            e.preventDefault();
            setSelectedSuggestion(i => (i - 1 + filtered.length) % filtered.length);
            return;
        }
    };

    useLayoutEffect(() => {
        if (!textAreaRef.current) return;
        textAreaRef.current.setSelectionRange(cursorPos, cursorPos);
    }, [cursorPos, textAreaRef]);

    const manageChanges: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        const value = e.target.value;
        setInput(value);
        setSelectedSuggestion(0);
        // Keep subcommand suggestions alive while typing within the subcommand context.
        // Clear in all other cases where suggestions no longer apply.
        if (subCmdPrefix !== null) {
            if (!value.startsWith(subCmdPrefix)) clearSuggestions();
        } else if (!value.startsWith('/') || value.includes(' ')) {
            clearSuggestions();
        }
    };

    useLayoutEffect(() => {
        const size = formRef.current?.getBoundingClientRect();
        const newOffset = {
            width: size?.width ?? 0,
            marginBottom: size?.height ?? 0,
        };
        if (prevOffsetRef.current.width !== newOffset.width || prevOffsetRef.current.marginBottom !== newOffset.marginBottom) {
            prevOffsetRef.current = newOffset;
            setSearchBoxOffset(newOffset);
        }
    }, [filtered.length]);

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
                    suggestions={filtered}
                    selected={selectedSuggestion}
                    onSelect={acceptSuggestion}
                />
                <div className="flex flex-row">
                    <TextareaAutosize
                        className="mr-5 ml-5 p-2 rounded-lg grow bg-gray-376 dark:bg-gray-375 resize-none placeholder-gray-175"
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
    { offset, suggestions, selected, onSelect }: Readonly<{
        offset: SearchBoxOffset;
        suggestions: string[];
        selected: number;
        onSelect: (s: string) => void;
    }>,
) => {
    const selectedRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        selectedRef.current?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    if (suggestions.length === 0) return null;

    return (
        <div
            style={{
                bottom: `${offset.marginBottom}px`,
                width: `${offset.width}px`,
            }}
            className="absolute mr-5 ml-5 mb-2 rounded-lg overflow-hidden shadow-lg border border-gray-500/30 bg-white dark:bg-gray-600"
        >
            <div className="max-h-48 overflow-y-auto">
                {suggestions.map((cmd, i) => (
                    <div
                        key={cmd}
                        ref={i === selected ? selectedRef : null}
                        className={cn(
                            'px-3 py-1.5 cursor-pointer text-sm text-gray-600 dark:text-gray-100',
                            'hover:bg-gray-376 dark:hover:bg-gray-375',
                            i === selected && 'bg-gray-376 dark:bg-gray-375',
                        )}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onSelect(cmd);
                        }}
                    >
                        {cmd}
                    </div>
                ))}
            </div>
        </div>
    );
};
