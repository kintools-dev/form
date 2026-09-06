import { type ReactNode, useId } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

import { Field, FieldContent, FieldError, FieldLabel } from "./ui/field.tsx";

export type FieldWrapperChildProps = {
  id: string;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
};

export type FieldWrapperProps<TValue, TParentValue> = {
  api: FieldApi<TValue, TParentValue>;
  label: string;
  /** `horizontal` puts the label beside the control (checkbox, switch). */
  orientation?: "vertical" | "horizontal";
  children: (
    field: FieldApi<TValue, TParentValue>,
    props: FieldWrapperChildProps,
  ) => ReactNode;
};

/**
 * The optional render-prop counterpart to composing shadcn's `Field`
 * primitives inline.
 *
 * `TextField`, `CheckboxField`, and `SelectField` each compose `Field` /
 * `FieldLabel` / `FieldError` directly (see the top of every file). This
 * collapses the shared `useWatch` + `useId` + `data-invalid` / `aria-*`
 * wiring into one place, for when that repetition adds up. Named
 * `FieldWrapper` because shadcn's own UI primitive already owns the name
 * `Field`.
 */
export function FieldWrapper<TValue, TParentValue>(
  { api, label, orientation = "vertical", children }: FieldWrapperProps<
    TValue,
    TParentValue
  >,
): ReactNode {
  const field = useWatch(api);
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = field.touched && field.invalid;
  const message = invalid ? field.error ?? field.schemaError : undefined;

  const control = children(field, {
    id,
    "aria-invalid": invalid || undefined,
    "aria-describedby": message ? errorId : undefined,
  });

  return (
    <Field orientation={orientation} data-invalid={invalid || undefined}>
      {orientation === "horizontal"
        ? (
          <>
            {control}
            <FieldContent>
              <FieldLabel htmlFor={id}>{label}</FieldLabel>
              <FieldError id={errorId}>{message}</FieldError>
            </FieldContent>
          </>
        )
        : (
          <>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {control}
            <FieldError id={errorId}>{message}</FieldError>
          </>
        )}
    </Field>
  );
}
