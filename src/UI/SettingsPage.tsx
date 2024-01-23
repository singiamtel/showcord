import { HTMLAttributes, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import AppearanceSettings from './settings/Appearance';
import DeveloperSettings from './settings/Developer';
import HighlightingSettings from './settings/Highlighting';

function SettingsButton(props: HTMLAttributes<'button'> & { onClick: () => void, active?: boolean }) {
    return (
        <button className={twMerge('text-gray-250 p-1.5 rounded flex hover-color dark:text-gray-351 ', props.className, props.active ? 'bg-gray-451 dark:bg-gray-450 dark:hover:bg-gray-450' : '')} onClick={props.onClick}>
            {props.children}
        </button>
    );
}

export default function SettingsPage(props: HTMLAttributes<'div'>) {
    const settingsTabs = {
        'appearance': AppearanceSettings,
        'highlighting': HighlightingSettings,
        'developer': DeveloperSettings,
    };
    const [page, setPage] = useState<keyof typeof settingsTabs>('appearance');
    return (
        <div className={twMerge('grid grid-cols-4', props.className)}>
            <div className="col-span-1 bg-gray-100 dark:bg-gray-75 p-8 flex flex-col border-r-2" id="settings-sidebar">

                <div className="font-bold text-sm text-gray-250 mb-2 ml-2 dark:text-gray-251">
                  GENERAL SETTINGS
                </div>
                <SettingsButton onClick={() => { setPage('appearance'); }} active={page === 'appearance'}>
                  Appearance
                </SettingsButton>
                <SettingsButton onClick={() => { setPage('highlighting'); }} active={page === 'highlighting'}>
                  Highlighting
                </SettingsButton>

                <SettingsButton onClick={() => { setPage('developer'); }} active={page === 'developer'}>
                  Developer settings
                </SettingsButton>
            </div>

            <div className="col-span-3 bg-gray-100 dark:bg-gray-450 p-8">
                {
                    (() => {
                        const Page = settingsTabs[page];
                        return <Page />;
                    })()
                }
            </div>
        </div>
    );
}
