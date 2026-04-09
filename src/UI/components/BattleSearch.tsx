import React, { useState, useEffect, useRef } from 'react';
import { useBattleStore } from '@/client/stores/battleStore';
import { client } from '@/client/singleton';
import { Button } from '@/components/ui/button';

export function BattleSearch() {
    const formats = useBattleStore(state => state.formats);
    const search = useBattleStore(state => state.search);
    const [selectedFormat, setSelectedFormat] = useState<string>('');
    const [displayValue, setDisplayValue] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const comboboxRef = useRef<HTMLDivElement>(null);

    const categories = (formats?.categories.map((category) => {
        const seenFormatIds = new Set<string>();
        return {
            ...category,
            formats: category.formats.filter((format) => {
                if (!format.settings.searchShow) return false;
                if (seenFormatIds.has(format.ID)) return false;
                seenFormatIds.add(format.ID);
                return true;
            }),
        };
    }).filter(category => category.formats.length > 0)) ?? [];
    const allFormats = categories.flatMap(category => category.formats);

    useEffect(() => {
        if (!selectedFormat && categories.length) {
            const preferred = ['gen9randombattle', 'gen9ou'];
            let found = null;
            for (const pref of preferred) {
                found = allFormats.find(f => f.ID === pref);
                if (found) break;
            }
            if (!found) found = categories[0]?.formats[0];
            if (found) {
                setSelectedFormat(found.ID);
                setDisplayValue(found.name);
            }
        }
    }, [allFormats, categories, selectedFormat]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
                closeDropdown();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedFormat, allFormats]);

    const closeDropdown = () => {
        setIsOpen(false);
        setSearchQuery('');
        const fmt = allFormats.find(f => f.ID === selectedFormat);
        setDisplayValue(fmt?.name ?? '');
        setActiveIndex(-1);
    };

    const selectFormat = (format: { ID: string; name: string }) => {
        setSelectedFormat(format.ID);
        setDisplayValue(format.name);
        setSearchQuery('');
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const filteredCategories = searchQuery.trim()
        ? [{
            name: 'Results',
            formats: allFormats.filter(f =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.ID.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 12),
        }]
        : categories;

    const flatFiltered = filteredCategories.flatMap(c => c.formats);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setDisplayValue(e.target.value);
        setIsOpen(true);
        setActiveIndex(-1);
    };

    const handleInputFocus = () => {
        setSearchQuery('');
        setDisplayValue('');
        setIsOpen(true);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) setIsOpen(true);
            setActiveIndex(prev => Math.min(prev + 1, flatFiltered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const active = flatFiltered[activeIndex];
            if (active) selectFormat(active);
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    };

    const searchingFormats = search.searching || [];
    const isSearching = searchingFormats.length > 0;

    const handleSearch = () => {
        if (selectedFormat) client.send(`/search ${selectedFormat}`, false);
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
                            const fmt = allFormats.find(x => x.ID === f);
                            return fmt ? fmt.name : f;
                        }).join(', ')}
                    </div>
                    <Button variant="destructive" className="w-full h-8" onClick={handleCancel}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-1.5">
                    <div ref={comboboxRef} className="relative">
                        <input
                            type="text"
                            value={displayValue}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onKeyDown={handleKeyDown}
                            placeholder="Search format…"
                            spellCheck={false}
                            autoComplete="off"
                            className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {isOpen && (
                            <div className="absolute left-0 right-0 bottom-[calc(100%+4px)] z-50 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5">
                                {flatFiltered.length === 0 ? (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">No matching formats</div>
                                ) : (
                                    filteredCategories.map(category => (
                                        <div key={category.name}>
                                            <div className="px-2.5 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-500 dark:text-teal-400">
                                                {category.name}
                                            </div>
                                            {category.formats.map(format => {
                                                const idx = flatFiltered.findIndex(f => f.ID === format.ID);
                                                return (
                                                    <button
                                                        key={format.ID}
                                                        type="button"
                                                        onMouseDown={(e) => { e.preventDefault(); selectFormat(format); }}
                                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex flex-col gap-0.5 transition-colors ${idx === activeIndex ? 'bg-teal-500/20' : 'hover:bg-teal-500/10'}`}
                                                    >
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{format.name}</span>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{format.ID}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
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
