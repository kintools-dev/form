import type { ReactNode } from "react";
import { type FieldApi, useWatch } from "@kintools/form-react";

export type ArrayFieldProps<TItem, TParentValue> = {
  api: FieldApi<TItem[], TParentValue>;
  label: ReactNode;
  newItem: () => TItem;
  /**
   * Derives a stable React list key from an item.
   *
   * Falls back to the array index when omitted.
   */
  itemKey?: (item: TItem) => string | number | bigint;
  children: (
    api: FieldApi<TItem[], TParentValue>,
    index: number,
  ) => ReactNode;
};

/**
 * A generic array editor for any item type at any path.
 *
 * `children` renders one item's fields, given the array api and the item's
 * `index`.
 */
export function ArrayField<TItem, TParentValue>({
  api,
  label,
  newItem,
  itemKey,
  children,
}: ArrayFieldProps<TItem, TParentValue>): ReactNode {
  const value = useWatch(api, (f) => f.value);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button
          type="button"
          onClick={() => api.pushItem("", newItem())}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          + Add
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {value.map((item, index) => (
          <div
            key={itemKey?.(item) ?? index}
            className="flex items-start gap-2"
          >
            <div className="flex-1">
              {children(api, index)}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => api.moveItem("", index, index - 1)}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                onClick={() => api.moveItem("", index, index + 1)}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Move down"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => api.removeItem("", index)}
                className="text-xs text-red-500 hover:text-red-600"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-gray-400">None yet.</p>
        )}
      </div>
    </div>
  );
}
