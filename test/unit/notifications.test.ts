import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('NotificationsEngine', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('loads without throwing when Notification API is available', async () => {
        vi.stubGlobal('Notification', {
            permission: 'default',
            requestPermission: vi.fn().mockResolvedValue('granted'),
        });

        await expect(import('@/client/notifications')).resolves.toBeDefined();
    });

    it('loads without throwing when Notification API is unavailable (iOS)', async () => {
        vi.stubGlobal('Notification', undefined);

        await expect(import('@/client/notifications')).resolves.toBeDefined();
    });

    it('sendNotification does not throw when Notification API is unavailable', async () => {
        vi.stubGlobal('Notification', undefined);
        vi.stubGlobal('document', { hasFocus: () => false });

        const { notificationsEngine } = await import('@/client/notifications');

        expect(() => notificationsEngine.sendNotification({
            user: 'user',
            message: 'hello',
            room: 'general',
            roomType: 'chat',
        })).not.toThrow();
    });

    it('askPermission does not throw when Notification API is unavailable', async () => {
        vi.stubGlobal('Notification', undefined);

        const { notificationsEngine } = await import('@/client/notifications');

        await expect(notificationsEngine.askPermission()).resolves.toBeUndefined();
    });
});
