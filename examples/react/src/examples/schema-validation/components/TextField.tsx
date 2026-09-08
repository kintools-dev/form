import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

const inputClasses = (invalid: boolean) =>
  `mt-1 block w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 ${
    invalid
      ? "border-red-400 focus:border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
  }`;

export type TextFieldProps<TParentValue> =
  & {
    api: FieldApi<string, TParentValue>;
    label?: ReactNode;
    required?: boolean | ReactNode;
  }
  & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "value" | "onChange" | "onBlur"
  >;

// `field.error` is this field's own `validators` message if it has one,
// otherwise its slice of the form's whole-tree `toSchemaValidator()` (see
// `App.tsx`), so one read covers both channels.
export function TextField<const TParentValue>(
  props: TextFieldProps<TParentValue>,
): ReactNode {
  const { api, label, required, className, ...inputProps } = props;
  const field = useWatch(api);
  const showError = field.invalid && field.touched;
  const message = field.error;
  const value = field.value;
  // `useId`, not `field.id`: `field.id` is a plain module-level counter
  // (stable across reorders, which is what makes it suitable as a React
  // `key`, see its own doc comment), not a server/client-matched value, so
  // rendering it into the DOM would mismatch under SSR.
  const reactId = useId();
  const inputId = `${field.name}-${reactId}`;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-red-500">
              {required === true ? "*" : required}
            </span>
          )}
        </label>
      )}
      <input
        {...inputProps}
        id={inputId}
        value={value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        className={`${inputClasses(!!showError)} ${className ?? ""}`}
      />
      {showError && <p className="mt-1 text-sm text-red-600">{message}</p>}
    </div>
  );
}
