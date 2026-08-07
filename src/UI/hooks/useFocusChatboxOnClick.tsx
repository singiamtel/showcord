import { useCallback, useRef } from 'react';

const INTERACTIVE_SELECTOR = 'a, button, textarea, input, select, [role="button"], [contenteditable="true"]';

// Clicking anywhere in the chat log should focus the chatbox, unless the user
// is selecting text or clicking on something interactive (links, buttons, etc).
export default function useFocusChatboxOnClick<T extends HTMLElement>() {
    const containerRef = useRef<T>(null);

    const onMouseUp = useCallback((e: React.MouseEvent) => {
        if (window.getSelection()?.toString()) return;
        const target = e.target as HTMLElement;
        if (target.closest(INTERACTIVE_SELECTOR)) return;
        containerRef.current?.querySelector('textarea')?.focus();
    }, []);

    return { containerRef, onMouseUp };
}
