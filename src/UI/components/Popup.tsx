import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/client/client';
import { Button } from '@/components/ui/button';
import { FormatMsgDisplay } from '@/UI/chatFormatting/MessageParser';

export function Popup() {
    const popup = useAppStore(state => state.popup);
    const setPopup = useAppStore(state => state.setPopup);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClose = useCallback(() => {
        setPopup(undefined);
    }, [setPopup]);

    useEffect(() => {
        if (!popup) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        buttonRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [popup, handleClose]);

    if (!popup) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label="Alert"
        >
            <div
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-xl max-w-md w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="mb-4 whitespace-pre-wrap text-sm text-gray-800">
                    {popup.startsWith('|html|') ?
                        popup.slice(6) :
                        <FormatMsgDisplay msg={popup.replace(/\|\|/g, '\n')} />
                    }
                </div>
                <div className="flex justify-end">
                    <Button ref={buttonRef} variant="outline" onClick={handleClose}>
                        OK
                    </Button>
                </div>
            </div>
        </div>
    );
}
