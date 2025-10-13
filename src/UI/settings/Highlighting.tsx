import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { type HTMLAttributes, useState } from 'react';
import { useClientContext } from '../components/single/useClientContext';
import { cn } from '@/lib/utils';

export default function HighlightingSettings(props: Readonly<HTMLAttributes<'div'>>) {
    const { client } = useClientContext();
    const [highlightWords, setHighlightWords] = useState(client.settings.getHighlightWordsMap());
    const [hlOnSelf, setHlOnSelf] = useState(client.settings.getHighlightOnSelf());
    // global goes first
    const rooms = Object.keys(highlightWords).sort((a, b) => {
        if (a === 'global') {
            return -1;
        }
        if (b === 'global') {
            return 1;
        }
        return 0;
    });//.filter((room) => room !== 'global');
    const refreshHighlightWords = () => {
        setHighlightWords({ ...client.settings.getHighlightWordsMap() });
    };

    return (
        <div className={cn('p-8', props.className)}>
            <h2 className="text-xl">
              Highlighting settings
            </h2>

            <div id="theme" className="mt-4">
                <div className="ml-2 flex items-center" onClick={() => {}} >
                    <span className='pr-4 flex items-center'>
                        <Switch checked={hlOnSelf} onCheckedChange={() => {
                            client.settings.setHighlightOnSelf(!hlOnSelf);
                            setHlOnSelf(client.settings.getHighlightOnSelf());
                        }} />
                    </span>
                    <Label htmlFor="theme">Highlight on your username</Label>
                </div>
            </div>
            <div className="pt-8">
        Highlight words by room:

                { rooms.length ? rooms.map((room) => {
                    const words = highlightWords[room];
                    return (
                        <div key={room} className="p-2">
                            <h3 className="py-4">
                                {room[0].toUpperCase() + room.slice(1)}
                            </h3>
                            <ul>
                                {words.map((word) => (
                                    <li key={word} className="flex items-center font-mono">
                                        <button
                                            type="button"
                                            className="bg-red-pastel hover:bg-red-600 text-black dark:text-white rounded px-2 py-1 mr-2"
                                            onClick={() => {
                                                client.settings.removeHighlightWord(room, word);
                                                refreshHighlightWords();
                                            }
                                            }
                                        > X </button>
                                        {word}

                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                }) : <p className="py-4 text-sm">No words to highlight</p>
                }

            </div>

        </div>
    );
}
