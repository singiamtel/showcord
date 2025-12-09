import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type Formats } from '../formatParser';

interface BattleStoreState {
    formats: Formats | undefined;
    search: {
        searching: string[];
        games: any;
    };
}

interface BattleStoreActions {
    setFormats: (formats: Formats) => void;
    updateSearch: (search: Partial<BattleStoreState['search']>) => void;
}

export type BattleStore = BattleStoreState & BattleStoreActions;

export const useBattleStore = create<BattleStore>()(
    immer((set) => ({
        formats: undefined,
        search: {
            searching: [],
            games: undefined,
        },

        setFormats: (formats: Formats) => {
            set({ formats });
        },

        updateSearch: (search: Partial<BattleStoreState['search']>) => {
            set((state) => {
                state.search = { ...state.search, ...search };
            });
        },
    }))
);
