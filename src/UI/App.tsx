import { library } from '@fortawesome/fontawesome-svg-core';
import { faBarChart, faPieChart } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

import Sidebar from './components/single/Sidebar';
import BigPanel from './components/single/BigPanel';
import { TrainerCardProvider } from './components/single/TrainerCard/TrainerCardContext';
import { useClientStore } from '@/client/client';
import { Toaster } from '@/components/ui/toaster';

library.add(faBarChart, faPieChart);

export default function App() {
    const theme = useClientStore(state => state.theme);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                setIsDark(e.matches);
            };
            setIsDark(mediaQuery.matches);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            setIsDark(theme === 'dark');
        }
    }, [theme]);

    return (
        <div className={`${isDark ? 'dark' : ''}`}>
            <div
                className={`grid grid-cols-7 grid-rows-1 md:h-screen text-text dark:text-text-dark dark:bg-gray-300 w-screen dark:[color-scheme:dark]`}
            >
                <TrainerCardProvider>
                    <Sidebar className="md:col-span-1 col-span-7 hidden md:flex" />
                    <BigPanel className="md:col-span-6 col-span-7" />
                </TrainerCardProvider>
            </div>
            <Toaster />
        </div>
    );
}
