/**
 * Form primitives — the single source of truth for every <input>, <textarea>,
 * <label>, submit button, and field-group pattern in the app.
 *
 * Rule of thumb: if a new page needs a form, it composes these. Any raw
 * `<input className="bg-bg border...">` or ad-hoc label should be migrated
 * here. See `src/app/(auth)/login/page.tsx` for the canonical wiring.
 */

export { FormField } from "./FormField";
export type { FormFieldProps } from "./FormField";

export { FormInput } from "./FormInput";
export type { FormInputProps } from "./FormInput";

export { FormTextarea } from "./FormTextarea";
export type { FormTextareaProps } from "./FormTextarea";

export { FormChoice } from "./FormChoice";
export type { FormChoiceProps, FormChoiceOption } from "./FormChoice";

export { FormSubmit } from "./FormSubmit";
export type { FormSubmitProps } from "./FormSubmit";

export { FormBanner } from "./FormBanner";
export type { FormBannerProps } from "./FormBanner";
