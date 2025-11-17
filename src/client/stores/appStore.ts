import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AppStoreState {
    theme: 'light' | 'dark' | 'system';
    error: string | undefined;
    isConnected: boolean;
}

interface AppStoreActions {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setError: (error: string | undefined) => void;
    setConnected: (connected: boolean) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>()(
    immer((set) => ({
        theme: (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') as 'light' | 'dark' | 'system' : null) ?? 'system',
        error: undefined,
        isConnected: false,

        setTheme: (theme: 'light' | 'dark' | 'system') => {
            set({ theme });
        },

        setError: (error: string | undefined) => {
            set({ error });
        },

        setConnected: (isConnected: boolean) => {
            set({ isConnected });
        },
    }))
);
