import React, { useState, useEffect } from 'react';
import { useBattleStore } from '@/client/stores/battleStore';
import { client } from '@/client/client';
import { Button } from '@/components/ui/button';

export function BattleSearch() {
    const formats = useBattleStore(state => state.formats);
    const search = useBattleStore(state => state.search);
    const [selectedFormat, setSelectedFormat] = useState<string>('');

    // Pre-select a popular format if available, or first one
    useEffect(() => {
        if (!selectedFormat && formats?.categories) {
            // Try to find a common format like Gen 9 Random Battle or OU
            const preferred = ['gen9randombattle', 'gen9ou'];
            let found = null;
            const allFormats = formats.categories.flatMap(c => c.formats);

            for (const pref of preferred) {
                found = allFormats.find(f => f.ID === pref);
                if (found) break;
            }

            if (found) {
                setSelectedFormat(found.ID);
            } else {
                const first = formats.categories[0]?.formats[0];
                if (first) setSelectedFormat(first.ID);
            }
        }
    }, [formats, selectedFormat]);

    const searchingFormats = search.searching || [];
    const isSearching = searchingFormats.length > 0;

    const handleSearch = () => {
        if (selectedFormat) {
            client.send(`/search ${selectedFormat}`, false);
        }
    };

    const handleCancel = () => {
        client.send(`/cancelsearch`, false);
    };

    if (!formats) return null;

    return (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            {isSearching ? (
                <div className="flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground text-center truncate px-1">
                        Searching: {searchingFormats.map(f => {
                            const fmt = formats.categories.flatMap(c => c.formats).find(x => x.ID === f);
                            return fmt ? fmt.name : f;
                        }).join(', ')}
                    </div>
                    <Button variant="destructive" className="w-full h-8" onClick={handleCancel}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <select
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                    >
                        {formats.categories.map((category) => (
                            <optgroup key={category.name} label={category.name}>
                                {category.formats.map((format) => (
                                    <option key={format.ID} value={format.ID}>
                                        {format.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <Button
                        className="w-full h-8 bg-red-600 hover:bg-red-700 text-white font-bold"
                        onClick={handleSearch}
                        disabled={!selectedFormat}
                    >
                        Battle!
                    </Button>
                </div>
            )}
        </div>
    );
}
