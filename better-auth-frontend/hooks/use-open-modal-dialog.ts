"use client";

import { useLayoutEffect, type RefObject } from "react";

/** Opens a native `<dialog>` as a modal on mount (client); closes on unmount. */
export function useOpenModalDialog(
  dialogRef: RefObject<HTMLDialogElement | null>,
  isClient: boolean,
): void {
  useLayoutEffect(() => {
    if (!isClient) return;
    const node = dialogRef.current;
    if (!node) return;

    const openDialog = () => {
      try {
        node.showModal();
      } catch {
        node.setAttribute("open", "");
      }
    };

    queueMicrotask(openDialog);

    return () => {
      node.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref object from useRef is stable; effect should not re-run on ref identity.
  }, [isClient]);
}
