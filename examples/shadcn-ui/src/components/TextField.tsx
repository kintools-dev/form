import { type ReactNode, useId } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

import { Field, FieldError, FieldLabel } from "./ui/field.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";

export type TextFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  type?: string;
  multiline?: boolean;
  autoComplete?: string;
  placeholder?: string;
};

/**
 * A text/textarea field bound to a `FieldApi<string>`.
 *
 * Composes shadcn's `Field` primitives directly: they are UI only, so this
 * wrapper supplies the state. `useWatch` subscribes to the field, and the
 * derived `invalid` / `message` drive `data-invalid`, `aria-*`, and
 * `FieldError`. `Input` and `Textarea` forward `value` / `onChange` /
 * `onBlur` straight to the native element.
 *
 * The commented block at the bottom is the same thing via the optional
 * `FieldWrapper` render-prop helper.
 */
export function TextField<TParentValue>(
  { api, label, type = "text", multiline = false, autoComplete, placeholder }:
    TextFieldProps<TParentValue>,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  const shared = {
    id,
    value: field.value,
    disabled: field.disabled,
    autoComplete,
    placeholder,
    "aria-invalid": invalid || undefined,
    "aria-describedby": message ? errorId : undefined,
    onBlur: field.handleBlur,
  };

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline
        ? (
          <Textarea
            {...shared}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )
        : (
          <Input
            {...shared}
            type={type}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      <FieldError id={errorId}>{message}</FieldError>
    </Field>
  );
}

// Option 2, using the FieldWrapper render-prop helper (./FieldWrapper.tsx):
//
//   export function TextField<TParentValue>(
//     { api, label, type = "text", multiline = false, autoComplete, placeholder }:
//       TextFieldProps<TParentValue>,
//   ): ReactNode {
//     return (
//       <FieldWrapper api={api} label={label}>
//         {(field, props) =>
//           multiline
//             ? (
//               <Textarea
//                 {...props}
//                 value={field.value}
//                 disabled={field.disabled}
//                 autoComplete={autoComplete}
//                 placeholder={placeholder}
//                 onBlur={field.handleBlur}
//                 onChange={(e) => field.handleChange(e.target.value)}
//               />
//             )
//             : (
//               <Input
//                 {...props}
//                 type={type}
//                 value={field.value}
//                 disabled={field.disabled}
//                 autoComplete={autoComplete}
//                 placeholder={placeholder}
//                 onBlur={field.handleBlur}
//                 onChange={(e) => field.handleChange(e.target.value)}
//               />
//             )}
//       </FieldWrapper>
//     );
//   }
