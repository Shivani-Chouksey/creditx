import { z } from "zod";

/**
 * Zod schemas for multi-stage form.
 * These mirror the backend DTOs in server/src/form/dto/*.
 * All validation must pass before hitting the API.
 */

export const GENDERS = ["male", "female", "non-binary", "prefer-not-to-say"];

// ── Stage 1 — Basic Info ───────────────────────────────────
export const stage1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters"),
  email: z
    .email("Enter a valid email address")
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Enter a valid phone number (7–15 digits, optional leading +)",
    ),
  dateOfBirth: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
      "Date of birth must be in YYYY-MM-DD format",
    )
    .optional()
    .or(z.literal("")),
  gender: z.enum(GENDERS).optional().or(z.literal("")),
});

// ── Stage 2 — Address ──────────────────────────────────────
export const stage2Schema = z.object({
  street: z
    .string()
    .trim()
    .min(1, "Street address is required")
    .max(250, "Street must not exceed 250 characters"),
  addressLine2: z
    .string()
    .trim()
    .max(100, "Address line 2 must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State / province is required").max(100),
  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code must be at least 3 characters")
    .max(20, "Postal code must not exceed 20 characters")
    .regex(
      /^[A-Za-z0-9\s\-]+$/,
      "Postal code may only contain letters, numbers, spaces, and hyphens",
    ),
  country: z.string().trim().min(1, "Country is required").max(100),
});

// ── Stage 3 — Professional ─────────────────────────────────
export const stage3Schema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must be at least 2 characters")
    .max(150),
  yearsOfExperience: z.coerce
    .number()
    .int("Years of experience must be a whole number")
    .min(0, "Years of experience cannot be negative")
    .max(60, "Years of experience cannot exceed 60"),
  skills: z
    .array(z.string().trim().min(1).max(60, "Each skill must not exceed 60 chars"))
    .optional()
    .default([]),
  linkedinUrl: z
    .url("LinkedIn URL must be a valid URL")
    .trim()
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

// ── Stage 4 — Documents ────────────────────────────────────
export const MIN_DOCUMENTS = 2;
export const MAX_DOCUMENTS = 5;
export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const stage4Schema = z.object({
  documents: z
    .array(z.instanceof(File))
    .min(MIN_DOCUMENTS, `Upload at least ${MIN_DOCUMENTS} documents`)
    .max(MAX_DOCUMENTS, `You can upload at most ${MAX_DOCUMENTS} documents`)
    .refine(
      (files) => files.every((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024),
      `Each file must be ≤ ${MAX_FILE_SIZE_MB} MB`,
    )
    .refine(
      (files) => files.every((f) => ACCEPTED_MIME_TYPES.includes(f.type)),
      "Only PDF, JPEG, PNG, DOC, and DOCX files are allowed",
    ),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

// ── Stage 5 — Review ───────────────────────────────────────
export const stage5Schema = z.object({
  reviewNotes: z
    .string()
    .trim()
    .max(1000, "Review notes must not exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

export const stageSchemas = {
  1: stage1Schema,
  2: stage2Schema,
  3: stage3Schema,
  4: stage4Schema,
  5: stage5Schema,
};

/**
 * Helper: run Zod on an object and return a field -> message map
 * TanStack Form's form-level validator expects `{ fields: { [name]: msg } }`.
 */
export const zodValidator = (schema) => ({ value }) => {
  const result = schema.safeParse(value);
  if (result.success) return undefined;
  const fields = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!fields[path]) fields[path] = issue.message;
  }
  return { fields };
};
