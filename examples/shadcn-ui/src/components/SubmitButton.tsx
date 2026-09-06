import type { ReactNode } from "react";
import { type FormApi, useWatch } from "@kintools/form-react";

import { Button } from "./ui/button.tsx";

export type SubmitButtonProps<TValue> = {
  api: FormApi<TValue>;
  pendingLabel: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * A submit button bound to a form's submit state.
 *
 * Disables itself while `api` is invalid, validating, or submitting, and
 * shows `pendingLabel` in place of `children` while submitting.
 */
export function SubmitButton<TValue>(
  { api, pendingLabel, className, children }: SubmitButtonProps<TValue>,
): ReactNode {
  const [invalid, validating, submitting] = useWatch(
    api,
    (f) => [f.invalid, f.validating, f.submitting] as const,
  );

  return (
    <Button
      type="submit"
      disabled={invalid || validating || submitting}
      className={className}
    >
      {submitting ? pendingLabel : children}
    </Button>
  );
}
