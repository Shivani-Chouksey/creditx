/**
 * Thin wrappers over TanStack Form's `<form.Field>` render prop that
 * standardise label / input / error styling across stages.
 *
 * Usage:
 *   <TextField form={form} name="fullName" label="Full name" />
 */

const baseInputCls =
  "w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const Label = ({ htmlFor, children, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const FieldErrors = ({ field }) => {
  const errors = field.state.meta.errors;
  if (!errors || errors.length === 0) return null;
  const first = errors[0];
  const msg = typeof first === "string" ? first : first?.message;
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
};

export const TextField = ({
  form,
  name,
  label,
  type = "text",
  placeholder,
  required,
  autoComplete,
}) => (
  <form.Field name={name}>
    {(field) => (
      <div>
        <Label htmlFor={name} required={required}>{label}</Label>
        <input
          id={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          className={baseInputCls}
        />
        <FieldErrors field={field} />
      </div>
    )}
  </form.Field>
);

export const TextAreaField = ({
  form,
  name,
  label,
  rows = 3,
  placeholder,
  required,
}) => (
  <form.Field name={name}>
    {(field) => (
      <div>
        <Label htmlFor={name} required={required}>{label}</Label>
        <textarea
          id={name}
          rows={rows}
          placeholder={placeholder}
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          className={baseInputCls}
        />
        <FieldErrors field={field} />
      </div>
    )}
  </form.Field>
);

export const SelectField = ({
  form,
  name,
  label,
  options,
  placeholder = "Select an option",
  required,
}) => (
  <form.Field name={name}>
    {(field) => (
      <div>
        <Label htmlFor={name} required={required}>{label}</Label>
        <select
          id={name}
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          className={baseInputCls}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <FieldErrors field={field} />
      </div>
    )}
  </form.Field>
);

export const NumberField = ({ form, name, label, min, max, required }) => (
  <form.Field name={name}>
    {(field) => (
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
          className={baseInputCls}
        />
        <FieldErrors field={field} />
      </div>
    )}
  </form.Field>
);
