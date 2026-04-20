import { useState } from "react"

/* -------------------- ERROR -------------------- */
export function FormError({ error }) {
  if (!error) return null

  return <p className="text-red-500 text-sm mt-1">{error}</p>
}

/* -------------------- INPUT -------------------- */
export function FormInput({
  field,
  label,
  type = "text",
  placeholder,
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
        </label>
      )}

      <input
        type={type}
        placeholder={placeholder}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        className={`input ${
          field.state.meta.errors?.length
            ? "border-red-500"
            : ""
        }`}
      />

      <FormError error={field.state.meta.errors?.[0]} />
    </div>
  )
}

/* -------------------- PASSWORD INPUT -------------------- */
export function PasswordInput({
  field,
  label,
  placeholder = "Enter password",
}) {
  const [show, setShow] = useState(false)

  const getStrength = (password) => {
    let score = 0
    if (password.length >= 6) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 1)
      return {
        label: "Weak",
        color: "bg-red-500",
        width: "25%",
      }

    if (score === 2)
      return {
        label: "Medium",
        color: "bg-yellow-500",
        width: "50%",
      }

    return {
      label: "Strong",
      color: "bg-green-500",
      width: "100%",
    }
  }

  const strength = getStrength(field.state.value)

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={field.state.value}
          onChange={(e) =>
            field.handleChange(e.target.value)
          }
          className="input pr-10"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-3 text-sm text-gray-500"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>

      {/* Strength Meter */}
      {field.state.value && (
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded">
            <div
              className={`h-2 ${strength.color}`}
              style={{ width: strength.width }}
            />
          </div>
          <p className="text-xs mt-1">
            Strength: {strength.label}
          </p>
        </div>
      )}

      <FormError error={field.state.meta.errors?.[0]} />
    </div>
  )
}