import { library } from '@fortawesome/fontawesome-svg-core';
import { faBarChart, faPieChart } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';

import Sidebar from './components/single/Sidebar';
import BigPanel from './components/single/BigPanel';
import { TrainerCardProvider } from './components/single/TrainerCard/TrainerCardContext';
import { useAppStore } from '@/client/client';
import { Toaster } from '@/components/ui/toaster';
import { useMediaQuery } from './hooks/useMediaQuery';

library.add(faBarChart, faPieChart);

export default function App() {
    const theme = useAppStore(state => state.theme);
    const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');

    const isDark = theme === 'system' ? systemPrefersDark : theme === 'dark';

    useEffect(() => {
        // Non-blocking prefetch of heavy chunks
        const prefetchBattle = async () => {
            try {
                // Prefetch the logic (heaviest part)
                await import('@/client/room/RealBattleRoom');
                // Prefetch the UI
                await import('./components/rooms/BattleRoom');
                console.debug('Battle resources prefetched successfully');
            } catch (e) {
                console.warn('Failed to prefetch battle resources', e);
            }
        };

        // Delay slightly to prioritize main thread for hydration/rendering
        const timer = setTimeout(() => {
            prefetchBattle();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`${isDark ? 'dark' : ''}`}>
            <title>Showcord - Pokemon Showdown Client</title>
            <meta name="description" content="Showcord is a modern, feature-rich client for Pokemon Showdown. Battle, chat, and connect with the community in style." />
            <div
                className={`grid grid-cols-7 grid-rows-1 md:h-screen text-text dark:text-text-dark dark:bg-gray-300 w-screen dark:scheme-dark`}
            >
                <TrainerCardProvider>
                    <Sidebar className="md:col-span-1 col-span-7 flex max-md:hidden" />
                    <BigPanel className="md:col-span-6 col-span-7" />
                </TrainerCardProvider>
            </div>
            <Toaster />
        </div>
    );
}
