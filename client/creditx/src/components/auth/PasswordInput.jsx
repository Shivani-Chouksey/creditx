import { useState } from "react";

const EyeIcon = ({ hidden }) =>
  hidden ? (
    // Eye with slash (password is visible — click to hide)
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.066 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.243 4.243L9.88 9.88" />
    </svg>
  ) : (
    // Eye open (password is hidden — click to show)
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

export default function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Password",
  autoComplete = "current-password",
  invalid,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <LockIcon />
      </span>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        className={`w-full pl-10 pr-11 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 transition
          ${
            invalid
              ? "border-red-300 focus:ring-red-400 focus:border-red-400"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
      >
        <EyeIcon hidden={visible} />
      </button>
    </div>
  );
}
