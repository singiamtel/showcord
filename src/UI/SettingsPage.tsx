import { HTMLAttributes, useContext } from 'react';
import { twMerge } from 'tailwind-merge';
import { PS_context } from './components/single/PS_context';

export default function SettingsPage(props: HTMLAttributes<'div'>) {
    const { client } = useContext(PS_context);
    return (
        <div className={twMerge(props.className, 'flex flex-col')}>
      Settings
        </div>
    );
}
