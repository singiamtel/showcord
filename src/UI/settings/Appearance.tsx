import { HTMLAttributes, useContext, useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { PS_context } from '../components/single/PS_context';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AppearanceSettings(props: HTMLAttributes<'div'>) {
    const { client, theme: currentTheme } = useContext(PS_context);
    const [theme, setTheme] = useState<'light' | 'dark'>(currentTheme);
    useEffect(() => {
        client.setTheme(theme);
    }, [theme]);
    return (
        <div className={twMerge('p-8', props.className)}>
            <h2 className="text-xl">
              Appearance settings
            </h2>

            <div id="theme" className="mt-4">
                <div className="ml-2 flex items-center" onClick={() => {}} >
                    <span className='pr-4 flex items-center'>
                        <Switch checked={theme === 'dark'} onCheckedChange={() => {
                            setTheme(theme === 'dark' ? 'light' : 'dark');
                        }} />
                    </span>
                    <Label htmlFor="theme">Use dark theme</Label>
                </div>
            </div>
        </div>
    );
}
