import type { ReactNode } from "react";

import { createContext, use, useCallback, useRef, useState } from "react";

import type { Button } from "./Button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "./AlertDialog";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

export type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  /** Extra content rendered between the description and the footer. */
  body?: ReactNode;
  icon?: ReactNode;
  /** Tailwind classes for the icon media element (e.g. danger vs primary). */
  mediaClassName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
};

/**
 * Resolves a confirmation dialog imperatively. `confirm(options)` returns a
 * promise that resolves `true` when the user confirms and `false` when they
 * cancel or dismiss. This keeps a confirm step inline in an async flow instead
 * of splitting it across pending-state and a separate handler.
 */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = use(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return confirm;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(options => {
    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve;
      setPending(options);
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setPending(null);
  }, []);

  return (
    <ConfirmContext value={confirm}>
      {children}
      {pending ? (
        <AlertDialog open onOpenChange={open => !open && settle(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              {pending.icon ? (
                <AlertDialogMedia className={pending.mediaClassName}>
                  {pending.icon}
                </AlertDialogMedia>
              ) : null}
              <AlertDialogTitle>{pending.title}</AlertDialogTitle>
              {pending.description ? (
                <AlertDialogDescription>
                  {pending.description}
                </AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>
            {pending.body}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => settle(false)}>
                {pending.cancelLabel ?? "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                variant={pending.confirmVariant ?? "primary"}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel ?? "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </ConfirmContext>
  );
}
