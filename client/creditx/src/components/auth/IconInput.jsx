/**
 * Text input with an optional leading icon, used by auth forms.
 */
export default function IconInput({
  id,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  icon,
  invalid,
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        className={`w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 transition
          ${
            invalid
              ? "border-red-300 focus:ring-red-400 focus:border-red-400"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
      />
    </div>
  );
}

export const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

export const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);
