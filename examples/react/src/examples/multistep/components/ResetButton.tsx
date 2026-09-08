import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

export type ResetButtonProps = {
  // deno-lint-ignore no-explicit-any
  api: FieldApi<any, any>;
  onReset: () => void;
  className?: string;
  children: ReactNode;
};

/**
 * A reset button bound to one form section's dirty state.
 *
 * Disables itself while `api` is pristine, and calls `onReset` when clicked.
 * Aim `api` at a wizard's current-step field to keep the button subscribed to
 * the step the user is actually on.
 */
export function ResetButton(
  { api, onReset, className, children }: ResetButtonProps,
): ReactNode {
  const dirty = useWatch(api, (f) => f.dirty);

  return (
    <button
      type="button"
      disabled={!dirty}
      onClick={onReset}
      className={`rounded-md px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}
