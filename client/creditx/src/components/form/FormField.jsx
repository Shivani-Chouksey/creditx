

const baseInputCls =
  "w-full border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition";
const validCls   = "border-gray-300 focus:ring-blue-500";
const invalidCls = "border-red-400 focus:ring-red-400 bg-red-50/40";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const Label = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const errorMessage = (field) => {
  const first = field.state.meta.errors?.[0];
  if (!first) return null;
  return typeof first === "string" ? first : first?.message ?? null;
};

const FieldError = ({ field }) => {
  // Don't surface errors until the user has interacted with the field,
  // so the form-level `onMount` validator doesn't paint every empty
  // required field red on first render.
  if (!field.state.meta.isTouched) return null;
  const msg = errorMessage(field);
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
};

/**
 * Build a per-field `onChange` validator from a single-field Zod schema
 * shape. Returns the first issue message, or `undefined` when valid.
 */
export const zodField = (zodShape) => ({ value }) => {
  const result = zodShape.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
};

export const TextField = ({
  form,
  name,
  label,
  type = "text",
  placeholder,
  required,
  autoComplete,
  validators,
  maxLength,
  inputMode,
  pattern,
  /**
   * Optional transform applied to the raw input string before it's
   * written to form state. Used to constrain what the user can type
   * (e.g. `digitsOnly` for phone numbers).
   */
  sanitize,
}) => (
  <form.Field name={name} validators={validators}>
    {(field) => {
      const invalid = field.state.meta.isTouched && !!errorMessage(field);
      return (
        <div>
          <Label htmlFor={name} required={required}>{label}</Label>
          <input
            id={name}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={field.state.value ?? ""}
            onChange={(e) => {
              let next = e.target.value;
              if (sanitize) next = sanitize(next);
              if (typeof maxLength === "number") next = next.slice(0, maxLength);
              field.handleChange(next);
            }}
            onBlur={field.handleBlur}
            maxLength={maxLength}
            inputMode={inputMode}
            pattern={pattern}
            aria-invalid={invalid || undefined}
            className={cx(baseInputCls, invalid ? invalidCls : validCls)}
          />
          <FieldError field={field} />
        </div>
      );
    }}
  </form.Field>
);

/** Strip every non-digit character — handy for phone / postal inputs. */
export const digitsOnly = (value) => String(value ?? "").replace(/\D+/g, "");

export const TextAreaField = ({
  form,
  name,
  label,
  rows = 3,
  placeholder,
  required,
  validators,
}) => (
  <form.Field name={name} validators={validators}>
    {(field) => {
      const invalid = field.state.meta.isTouched && !!errorMessage(field);
      return (
        <div>
          <Label htmlFor={name} required={required}>{label}</Label>
          <textarea
            id={name}
            rows={rows}
            placeholder={placeholder}
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            aria-invalid={invalid || undefined}
            className={cx(baseInputCls, invalid ? invalidCls : validCls)}
          />
          <FieldError field={field} />
        </div>
      );
    }}
  </form.Field>
);

export const SelectField = ({
  form,
  name,
  label,
  options,
  placeholder = "Select an option",
  required,
  validators,
}) => (
  <form.Field name={name} validators={validators}>
    {(field) => {
      const invalid = field.state.meta.isTouched && !!errorMessage(field);
      return (
        <div>
          <Label htmlFor={name} required={required}>{label}</Label>
          <select
            id={name}
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            aria-invalid={invalid || undefined}
            className={cx(baseInputCls, invalid ? invalidCls : validCls)}
          >
            <option value="">{placeholder}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError field={field} />
        </div>
      );
    }}
  </form.Field>
);

export const NumberField = ({
  form,
  name,
  label,
  min,
  max,
  required,
  validators,
}) => (
  <form.Field name={name} validators={validators}>
    {(field) => {
      const invalid = field.state.meta.isTouched && !!errorMessage(field);
      return (
        <div>
          <Label htmlFor={name} required={required}>{label}</Label>
          <input
            id={name}
            type="number"
            min={min}
            max={max}
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            aria-invalid={invalid || undefined}
            className={cx(baseInputCls, invalid ? invalidCls : validCls)}
          />
          <FieldError field={field} />
        </div>
      );
    }}
  </form.Field>
);
