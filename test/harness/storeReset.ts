import { useAppStore } from '@/client/stores/appStore';
import { useBattleStore } from '@/client/stores/battleStore';
import { useMessageStore } from '@/client/stores/messageStore';
import { useNotificationStore } from '@/client/stores/notificationStore';
import { useRoomStore } from '@/client/stores/roomStore';
import { useUserStore } from '@/client/stores/userStore';

const stores = [
    useAppStore,
    useBattleStore,
    useMessageStore,
    useNotificationStore,
    useRoomStore,
    useUserStore,
] as const;

export function resetAllStores() {
    for (const store of stores) {
        (store as any).setState((store as any).getInitialState(), true);
    }
}
