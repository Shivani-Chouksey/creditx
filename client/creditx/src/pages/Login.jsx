import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { apiClient } from "../../apiClient";
import { API_URLS } from "../../api_endpoints";
import AuthLayout from "../components/auth/AuthLayout";
import IconInput, { EmailIcon } from "../components/auth/IconInput";
import PasswordInput from "../components/auth/PasswordInput";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Returns { field: message } for TanStack Form's form-level validator
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

export default function Login() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onSubmit: zodFieldErrors(loginSchema),
      onBlur:   zodFieldErrors(loginSchema),
      onChange:   zodFieldErrors(loginSchema),
    },
    validateOnChange: true,
    onSubmit: async ({ value }) => {
      setServerError("");
      try {
        const res = await apiClient.post(API_URLS.AUTH.LOGIN, value);
        const token = res.data?.data?.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
          navigate({ to: "/dashboard" });
        } else {
          setServerError("Unexpected response from server. Please try again.");
        }
      } catch (err) {
        setServerError(
          err?.response?.data?.message ||
            "Unable to sign in. Check your credentials and try again.",
        );
      }
    },
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue managing your applications and documents."
    >
      <div className="bg-white rounded-2xl shadow-xl p-7 md:p-8 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your credentials to access your dashboard.
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
          {/* Email */}
          <form.Field name="email">
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
                    
onChange={(value) => {
  field.handleChange(value);
  field.handleBlur(); // ✅ FORCE instant error
  }}

                    // onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    icon={<EmailIcon />}
                    invalid={!!error}
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
          <form.Field name="password">
            {(field) => {
              const error = field.state.meta.errors?.[0];
              return (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                      Password
                    </label>
                    <span className="text-xs text-gray-400">
                      Forgot password?
                    </span>
                  </div>
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    value={field.state.value}
                    
onChange={(value) => {
  field.handleChange(value);
  field.handleBlur(); // ✅ FORCE instant error
  }}

                    // onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    invalid={!!error}
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
                {isSubmitting ? "Signing in…" : "Sign in"}
              </button>
            )}
          </form.Subscribe>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">New to CreditX?</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        <Link
          to="/register"
          className="block text-center w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition"
        >
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}
