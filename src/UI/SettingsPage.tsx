import { type HTMLAttributes, useState } from 'react';
import AppearanceSettings from './settings/Appearance';
import DeveloperSettings from './settings/Developer';
import HighlightingSettings from './settings/Highlighting';
import { cn } from '@/lib/utils';
import AccountSettings from './settings/Account';

function SettingsButton(props: Readonly<HTMLAttributes<'button'> & { onClick: () => void, active?: boolean }>) {
    return (
        <button type="button" className={cn('text-gray-250 p-1.5 rounded text-left hover-color dark:text-gray-351 ', props.className, props.active ? 'bg-gray-451 dark:bg-gray-450 dark:hover:bg-gray-450' : '')} onClick={props.onClick}>
            {props.children}
        </button>
    );
}

const settingsTabs = {
    'appearance': AppearanceSettings,
    'highlighting': HighlightingSettings,
    'developer': DeveloperSettings,
    'account': AccountSettings,
} as const;

export default function SettingsPage(props: Readonly<HTMLAttributes<'div'>>) {
    const [page, setPage] = useState<keyof typeof settingsTabs>('appearance');
    return (
        <div className={cn('grid grid-cols-4', props.className)}>
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

                <SettingsButton onClick={() => { setPage('account'); }} active={page === 'account'}>
                  Account
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
