import { type ReactNode, useId } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

import { Field, FieldError, FieldLabel } from "./ui/field.tsx";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "./ui/select.tsx";

export type SelectFieldProps<TParentValue> = {
  api: FieldApi<string, TParentValue>;
  label: string;
  placeholder?: string;
  /** `SelectItem`s (plus any `SelectGroup` / `SelectSeparator`). */
  children: ReactNode;
};

/**
 * A select bound to a `FieldApi<string>`.
 *
 * Radix's `Select` is controlled with `value` / `onValueChange` (a bare
 * string, no event) and its trigger has no useful `onBlur`, so `handleBlur`
 * fires from `onOpenChange` on close. The wrapper owns the trigger (and its
 * `id` / `aria-*`) and `SelectContent`; the items come in as `children`, since
 * `Select` is a composition API, not a list of option objects.
 *
 * The commented block at the bottom is the same thing via the optional
 * `FieldWrapper` render-prop helper.
 */
export function SelectField<TParentValue>(
  { api, label, placeholder, children }: SelectFieldProps<TParentValue>,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={field.value}
        disabled={field.disabled}
        onValueChange={field.handleChange}
        onOpenChange={(open) => {
          if (!open) field.handleBlur();
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={invalid || undefined}
          aria-describedby={message ? errorId : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      <FieldError id={errorId}>{message}</FieldError>
    </Field>
  );
}

// Option 2, using the FieldWrapper render-prop helper (./FieldWrapper.tsx):
//
//   export function SelectField<TParentValue>(
//     { api, label, placeholder, children }: SelectFieldProps<TParentValue>,
//   ): ReactNode {
//     return (
//       <FieldWrapper api={api} label={label}>
//         {(field, props) => (
//           <Select
//             value={field.value}
//             disabled={field.disabled}
//             onValueChange={field.handleChange}
//             onOpenChange={(open) => {
//               if (!open) field.handleBlur();
//             }}
//           >
//             <SelectTrigger {...props} className="w-full">
//               <SelectValue placeholder={placeholder} />
//             </SelectTrigger>
//             <SelectContent>{children}</SelectContent>
//           </Select>
//         )}
//       </FieldWrapper>
//     );
//   }
