import { HTMLAttributes, useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useClientContext } from '../components/single/ClientContext';
import { cn } from '@/lib/utils';

export default function AppearanceSettings(props: Readonly<HTMLAttributes<'div'>>) {
    const { client, theme: currentTheme } = useClientContext();
    const [theme, setTheme] = useState<'light' | 'dark'>(currentTheme);
    useEffect(() => {
        client.setTheme(theme);
    }, [theme]);
    return (
        <div className={cn('p-8', props.className)}>
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
