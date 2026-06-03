import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AppStoreState {
    theme: 'light' | 'dark' | 'system';
    error: string | undefined;
    isConnected: boolean;
    isReconnecting: boolean;
    popup: string | undefined;
    settingsSection: string | undefined;
}

interface AppStoreActions {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setError: (error: string | undefined) => void;
    setConnected: (connected: boolean) => void;
    setReconnecting: (reconnecting: boolean) => void;
    setPopup: (popup: string | undefined) => void;
    setSettingsSection: (section: string | undefined) => void;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>()(
    immer((set) => ({
        theme: (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') as 'light' | 'dark' | 'system' : null) ?? 'system',
        error: undefined,
        isConnected: false,
        isReconnecting: false,
        popup: undefined,
        settingsSection: undefined,

        setTheme: (theme: 'light' | 'dark' | 'system') => {
            set({ theme });
        },

        setError: (error: string | undefined) => {
            set({ error });
        },

        setConnected: (isConnected: boolean) => {
            set({ isConnected });
        },

        setReconnecting: (isReconnecting: boolean) => {
            set({ isReconnecting });
        },

        setPopup: (popup: string | undefined) => {
            set({ popup });
        },

        setSettingsSection: (section: string | undefined) => {
            set({ settingsSection: section });
        },
    }))
);
