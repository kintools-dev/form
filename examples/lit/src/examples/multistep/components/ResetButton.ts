import { html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import { __decorate } from "tslib";
import { type FieldApi, WatchController } from "@kintools/form-lit";

/**
 * A reset button bound to one form section's dirty state.
 *
 * Disables itself while `.api` is pristine, and calls `.onReset` when
 * clicked. `.api` is re-read on every update, so aiming it at a wizard's
 * current-step field keeps the button subscribed to the step the user is
 * actually on.
 */
export class ResetButton extends LitElement {
  // `declare` + constructor defaults rather than plain class fields, for the
  // reason spelled out in `SubmitButton`.
  // deno-lint-ignore no-explicit-any
  declare api: FieldApi<any, any>;
  declare label: string;
  declare buttonClass: string;
  declare onReset: () => void;

  readonly #watch = new WatchController(
    this,
    () => this.api,
    (f) => f.dirty,
  );

  constructor() {
    super();
    this.label = "Reset";
    this.buttonClass = "";
    this.onReset = () => {};
  }

  override createRenderRoot(): this {
    return this;
  }

  override render(): unknown {
    const dirty = this.#watch.value;

    return html`
      <button
        type="button"
        ?disabled=${!dirty}
        @click=${() => this.onReset()}
        class="rounded-md px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 ${this
          .buttonClass}"
      >
        ${this.label}
      </button>
    `;
  }
}

// See `SubmitButton` for why `__decorate` is called by hand instead of using
// `@property()` decorator syntax.
__decorate(
  [property({ attribute: false })],
  ResetButton.prototype,
  "api",
  void 0,
);
__decorate(
  [property({ type: String })],
  ResetButton.prototype,
  "label",
  void 0,
);
__decorate(
  [property({ type: String, attribute: "button-class" })],
  ResetButton.prototype,
  "buttonClass",
  void 0,
);
__decorate(
  [property({ attribute: false })],
  ResetButton.prototype,
  "onReset",
  void 0,
);

customElements.define("multistep-reset-button", ResetButton);

declare global {
  interface HTMLElementTagNameMap {
    "multistep-reset-button": ResetButton;
  }
}
