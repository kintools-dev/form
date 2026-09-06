import { type ReactNode, useId } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

import { Field, FieldContent, FieldError, FieldLabel } from "./ui/field.tsx";
import { Checkbox } from "./ui/checkbox.tsx";

/** Radix's tri-state checkbox value. */
type CheckedValue = boolean | "indeterminate";

export type CheckboxFieldProps<TValue extends CheckedValue, TParentValue> = {
  api: FieldApi<TValue, TParentValue>;
  label: string;
};

/**
 * A checkbox bound to a `FieldApi<boolean>`, or `FieldApi<boolean |
 * "indeterminate">` for the tri-state case.
 *
 * Radix's `Checkbox` is controlled through `checked` / `onCheckedChange`, both
 * `boolean | "indeterminate"`, and hands the next state back directly (no
 * event), so `field.value` and `field.handleChange` pass straight through.
 * Laid out with `Field orientation="horizontal"` and `FieldContent`, so the
 * label sits beside the box and the error still drops below.
 *
 * The commented block at the bottom is the same thing via the optional
 * `FieldWrapper` render-prop helper.
 */
export function CheckboxField<TValue extends CheckedValue, TParentValue>(
  { api, label }: CheckboxFieldProps<TValue, TParentValue>,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  return (
    <Field orientation="horizontal" data-invalid={invalid || undefined}>
      <Checkbox
        id={id}
        checked={field.value}
        disabled={field.disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={message ? errorId : undefined}
        onBlur={field.handleBlur}
        // Radix only emits "indeterminate" when `checked` was already
        // "indeterminate", so `next` never widens past what the field allows.
        onCheckedChange={(next) => field.handleChange(next as TValue)}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldError id={errorId}>{message}</FieldError>
      </FieldContent>
    </Field>
  );
}

// Option 2, using the FieldWrapper render-prop helper (./FieldWrapper.tsx):
//
//   export function CheckboxField<TValue extends CheckedValue, TParentValue>(
//     { api, label }: CheckboxFieldProps<TValue, TParentValue>,
//   ): ReactNode {
//     return (
//       <FieldWrapper api={api} label={label} orientation="horizontal">
//         {(field, props) => (
//           <Checkbox
//             {...props}
//             checked={field.value}
//             disabled={field.disabled}
//             onBlur={field.handleBlur}
//             onCheckedChange={(next) => field.handleChange(next as TValue)}
//           />
//         )}
//       </FieldWrapper>
//     );
//   }
