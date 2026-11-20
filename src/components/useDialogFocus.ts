import { useEffect, type RefObject } from 'react';

// Keep Tab inside the native dialog, including the browser's wrap boundary.
// Escape and trigger-focus restoration continue to use native dialog behaviour.
export default function useDialogFocus(ref: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog.open) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', handleKey);
    return () => dialog.removeEventListener('keydown', handleKey);
  }, [ref]);
}
