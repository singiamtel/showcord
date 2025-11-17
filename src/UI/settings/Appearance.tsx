import { type HTMLAttributes } from 'react';
import { Label } from '@/components/ui/label';
import { useClientContext } from '../components/single/useClientContext';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/client/client';

type ThemeOption = 'light' | 'dark' | 'system';

function ThemePillSelector({ value, onChange }: { value: ThemeOption; onChange: (theme: ThemeOption) => void }) {
    const options: { value: ThemeOption; label: string }[] = [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
    ];

    return (
        <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
            {options.map((option) => (
                <button
                    type="button"
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'px-3 py-1 text-sm font-medium rounded transition-colors',
                        value === option.value ?
                            'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' :
                            'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export default function AppearanceSettings(props: Readonly<HTMLAttributes<'div'>>) {
    const { client } = useClientContext();
    const theme = useAppStore(state => state.theme);

    return (
        <div className={cn('p-8', props.className)}>
            <h2 className="text-xl">
              Appearance settings
            </h2>

            <div id="theme" className="mt-4">
                <div className="ml-2 flex items-center gap-4">
                    <Label htmlFor="theme">Theme</Label>
                    <ThemePillSelector
                        value={theme}
                        onChange={(newTheme) => client.setTheme(newTheme)}
                    />
                </div>
            </div>
        </div>
    );
}
