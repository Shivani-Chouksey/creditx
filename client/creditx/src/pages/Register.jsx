import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { apiClient } from "../../apiClient";
import { API_URLS } from "../../api_endpoints";
import AuthLayout from "../components/auth/AuthLayout";
import IconInput, {
  EmailIcon,
  UserIcon,
} from "../components/auth/IconInput";
import PasswordInput from "../components/auth/PasswordInput";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters"),
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const zodFieldErrors = (schema) => ({ value }) => {
  const result = schema.safeParse(value);
  if (result.success) return undefined;
  const errs = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errs[key]) errs[key] = issue.message;
  }
  return { fields: errs };
};

/* Password strength evaluated against independent criteria */
const passwordChecks = (pw = "") => [
  { label: "At least 8 characters", ok: pw.length >= 8 },
  { label: "One uppercase letter", ok: /[A-Z]/.test(pw) },
  { label: "One lowercase letter", ok: /[a-z]/.test(pw) },
  { label: "One number", ok: /[0-9]/.test(pw) },
  { label: "One special character", ok: /[^A-Za-z0-9]/.test(pw) },
];

const strengthFromScore = (score) => {
  if (score <= 1) return { label: "Very weak", color: "bg-red-500", width: "20%" };
  if (score === 2) return { label: "Weak", color: "bg-orange-500", width: "40%" };
  if (score === 3) return { label: "Fair", color: "bg-yellow-500", width: "60%" };
  if (score === 4) return { label: "Good", color: "bg-lime-500", width: "80%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
};

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showStrength, setShowStrength] = useState(false);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    // validators: {
    //   onChange: zodFieldErrors(registerSchema),
    //   onSubmit: zodFieldErrors(registerSchema),
    //   onBlur: zodFieldErrors(registerSchema),
    // },
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        const { confirmPassword: _ignore, ...payload } = value;
        await apiClient.post(API_URLS.AUTH.REGISTER, payload);
        navigate({ to: "/login" });
      } catch (err) {
        const msg = err?.response?.data?.message;
        setServerError(
          Array.isArray(msg)
            ? msg.join(", ")
            : msg || "Registration failed. Please try again.",
        );
      }
    },
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your application in minutes. Save progress, resume anywhere."
    >
      <div className="bg-white rounded-2xl shadow-xl p-7 md:p-8 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Sign up</h2>
          <p className="text-sm text-gray-500 mt-1">
            It only takes a minute to create your CreditX account.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg flex items-start gap-2"
          >
            <span aria-hidden>⚠️</span>
            <span className="flex-1">{serverError}</span>
            <button
              type="button"
              onClick={() => setServerError("")}
              className="text-red-400 hover:text-red-700"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          noValidate
          className="space-y-4"
        >
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="firstName" validators={{
              onChange: ({ value }) => {
                const result = registerSchema.shape.firstName.safeParse(value);
                return result.success ? undefined : result.error.issues[0].message;
              },
            }}>
              {(field) => {
                const error = field.state.meta.errors?.[0];
                return (
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 mb-1">
                      First name
                    </label>
                    <IconInput
                      id="firstName"
                      autoComplete="given-name"
                      placeholder="Jane"
                      value={field.state.value}
                      // onChange={(value) => {
                      //   field.handleChange(value);
                      //   field.handleBlur(); // ✅ FORCE instant error
                      // }}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      icon={<UserIcon />}
                      // invalid={!!error}
                      invalid={field.state.meta.isTouched && !!error}
                    />
                    {error && (
                      <p className="text-red-600 text-xs mt-1">
                        {typeof error === "string" ? error : error?.message}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>

            <form.Field name="lastName" validators={{
              onChange: ({ value }) => {
                const result = registerSchema.shape.lastName.safeParse(value);
                return result.success ? undefined : result.error.issues[0].message;
              },
            }}>
              {(field) => {
                const error = field.state.meta.errors?.[0];
                return (
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 mb-1">
                      Last name
                    </label>
                    <IconInput
                      id="lastName"
                      autoComplete="family-name"
                      placeholder="Doe"
                      value={field.state.value}
                      onChange={field.handleChange}
                      // onChange={(value) => {
                      //   field.handleChange(value);
                      //   field.handleBlur(); // ✅ FORCE instant error
                      // }}
                      onBlur={field.handleBlur}
                      icon={<UserIcon />}
                      invalid={field.state.meta.isTouched && !!error}
                    />
                    {error && (
                      <p className="text-red-600 text-xs mt-1">
                        {typeof error === "string" ? error : error?.message}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>
          </div>

          {/* Email */}
          <form.Field name="email" validators={{
            onChange: ({ value }) => {
              const result = registerSchema.shape.email.safeParse(value);
              return result.success ? undefined : result.error.issues[0].message;
            },
          }}>
            {(field) => {
              const error = field.state.meta.errors?.[0];
              return (
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <IconInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onChange={field.handleChange}
                    // onChange={(value) => {
                    //   field.handleChange(value);
                    //   field.handleBlur(); // ✅ FORCE instant error
                    // }}
                    onBlur={field.handleBlur}
                    icon={<EmailIcon />}
                    invalid={field.state.meta.isTouched && !!error}
                  />
                  {error && (
                    <p className="text-red-600 text-xs mt-1">
                      {typeof error === "string" ? error : error?.message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          {/* Password */}
          <form.Field name="password" validators={{
            onChange: ({ value }) => {
              const result = registerSchema.shape.password.safeParse(value);
              return result.success ? undefined : result.error.issues[0].message;
            },
          }}>
            {(field) => {
              const error = field.state.meta.errors?.[0];
              const checks = passwordChecks(field.state.value);
              const score = checks.filter((c) => c.ok).length;
              const strength = strengthFromScore(score);
              const showMeter = showStrength || !!field.state.value;

              return (
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={field.state.value}
                    onChange={(v) => {
                      field.handleChange(v);
                      setShowStrength(true);
                      // field.handleBlur()
                    }}
                    onBlur={field.handleBlur}
                    invalid={field.state.meta.isTouched && !!error}
                  />

                  {showMeter && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} transition-all`}
                            style={{ width: strength.width }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-600 w-16 text-right">
                          {strength.label}
                        </span>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                        {checks.map((c) => (
                          <li
                            key={c.label}
                            className={`text-[11px] flex items-center gap-1.5 ${c.ok ? "text-green-600" : "text-gray-400"
                              }`}
                          >
                            <span className="w-3 h-3 rounded-full border flex items-center justify-center text-[9px]"
                              style={{
                                borderColor: c.ok ? "#16a34a" : "#d1d5db",
                                background: c.ok ? "#16a34a" : "transparent",
                                color: c.ok ? "white" : "transparent",
                              }}
                            >
                              ✓
                            </span>
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {error && (
                    <p className="text-red-600 text-xs mt-1">
                      {typeof error === "string" ? error : error?.message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          {/* Confirm password */}
          <form.Field name="confirmPassword"
            validators={{
              onChange: ({ value, fieldApi }) => {
                const password = fieldApi.form.state.values.password;

                if (!value) {
                  return 'Please confirm your password';
                }

                if (value !== password) {
                  return 'Passwords do not match';
                }

                return undefined;
              },
            }}
          >
            {(field) => {
              const error = field.state.meta.errors?.[0];
              return (
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm password
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={field.state.value}
                    onChange={field.handleChange}
                    // onChange={(value) => {
                    //   field.handleChange(value);
                    //   field.handleBlur(); // ✅ FORCE instant error
                    // }}
                    onBlur={field.handleBlur}
                    invalid={field.state.meta.isTouched && !!error}
                  />
                  {error && (
                    <p className="text-red-600 text-xs mt-1">
                      {typeof error === "string" ? error : error?.message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(s) => [s.isSubmitting, s.canSubmit]}>
            {([isSubmitting, canSubmit]) => (
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            )}
          </form.Subscribe>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
