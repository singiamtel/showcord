import { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export default function SettingsPage(props: HTMLAttributes<'div'>) {
    return (
        <div className={twMerge(props.className, 'flex flex-col')}>
      Settings
        </div>
    );
}
