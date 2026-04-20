// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

// @Schema({ timestamps: true })
// export class Form {
//   @Prop() firstName!: string;
//   @Prop() lastName!: string;
//   @Prop() email!: string;
//   @Prop() phone!: string;

//   @Prop() addressLine1!: string;
//   @Prop() city!: string;
//   @Prop() state!: string;
//   @Prop() country!: string;
//   @Prop() pincode!: string;

//   @Prop() currentCompany!: string;
//   @Prop() designation!: string;
//   @Prop() experienceYears!: number;
//   @Prop() skills!: string;

//   @Prop({
//     type: {
//       resume: String,
//       idProof: String,
//       photo: String,
//     },
//   })
//   documents!: Record<string, any>;

//   @Prop({ default: 1 })
//   currentStage!: number;

//   @Prop({ default: "in-progress" })
//   status!: string;
// }

// export const FormSchema = SchemaFactory.createForClass(Form);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FormDocument = Form & Document;

// ─────────────────────────────────────────────────────────
//  ENUMS
// ─────────────────────────────────────────────────────────

export enum FormStatus {
  IN_PROGRESS = 'in-progress',
  COMPLETED   = 'completed',
}

export enum FormStage {
  BASIC_INFO    = 1,
  ADDRESS       = 2,
  PROFESSIONAL  = 3,
  DOCUMENTS     = 4,
  REVIEW_SUBMIT = 5,
}

// ─────────────────────────────────────────────────────────
//  NESTED SUB-SCHEMAS  (_id: false = embedded, no own _id)
// ─────────────────────────────────────────────────────────

@Schema({ _id: false })
export class BasicInfoSchema {
  @Prop({ required: true, trim: true, maxlength: 100 })
  fullName!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ type: String, trim: true, default: null })
  dateOfBirth!: string | null;

  @Prop({ type: String, trim: true, maxlength: 10, default: null })
  gender!: string | null;
}

@Schema({ _id: false })
export class AddressSchema {
  @Prop({ required: true, trim: true, maxlength: 250 })
  street!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  city!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  state!: string;

  @Prop({ required: true, trim: true, maxlength: 20 })
  postalCode!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  country!: string;

  /** Optional second address line */
  @Prop({ type: String, trim: true, default: null })
  addressLine2!: string | null;
}

@Schema({ _id: false })
export class ProfessionalSchema {
  @Prop({ required: true, trim: true, maxlength: 200 })
  companyName!: string;

  @Prop({ required: true, trim: true, maxlength: 150 })
  jobTitle!: string;

  @Prop({ required: true, min: 0, max: 60 })
  yearsOfExperience!: number;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: String, trim: true, default: null })
  linkedinUrl!: string | null;

  @Prop({ type: String, trim: true, maxlength: 500, default: null })
  bio!: string | null;
}

@Schema({ _id: false })
export class UploadedFileSchema {
  /** Original filename from the client */
  @Prop({ required: true })
  originalName!: string;

  /** UUID-based filename saved to disk */
  @Prop({ required: true })
  storedName!: string;

  /** Relative public URL path  e.g. /uploads/documents/uuid.pdf */
  @Prop({ required: true })
  publicPath!: string;

  @Prop({ required: true })
  mimetype!: string;

  /** File size in bytes */
  @Prop({ required: true })
  size!: number;

  @Prop({ default: () => new Date() })
  uploadedAt!: Date;
}

// ─────────────────────────────────────────────────────────
//  ROOT FORM SCHEMA
// ─────────────────────────────────────────────────────────

@Schema({
  collection: 'forms',
  timestamps: true,
  toJSON: {
    virtuals: true,
    // transform: (_doc, ret) => {
    //   delete ret.__v;
    //   return ret;
    // },
  },
})
export class Form {
  /** Owner reference — indexed for fast per-user queries */
  @Prop({
    type:     Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  })
  userId!: Types.ObjectId;

  /**
   * The highest stage the user has *saved*.
   * Stage continuity: frontend reads this and forwards the user
   * directly to (currentStage + 1) or the review page if 5.
   */
  @Prop({
    type:    Number,
    enum:    [1, 2, 3, 4, 5],
    default: FormStage.BASIC_INFO,
  })
  currentStage!: number;

  @Prop({
    type:    String,
    enum:    FormStatus,
    default: FormStatus.IN_PROGRESS,
    index:   true,
  })
  status!: FormStatus;

  // ── Stage data (each saved independently) ─────────────
  @Prop({ type: BasicInfoSchema,    default: null })
  basicInfo!: BasicInfoSchema | null;

  @Prop({ type: AddressSchema,      default: null })
  addressDetails!: AddressSchema | null;

  @Prop({ type: ProfessionalSchema, default: null })
  professionalDetails!: ProfessionalSchema | null;

  @Prop({ type: [UploadedFileSchema], default: [] })
  documents!: UploadedFileSchema[];

  /** Final reviewer notes before submission */
  @Prop({ type: String, trim: true, maxlength: 1000, default: null })
  reviewNotes!: string | null;

  /** Set when status transitions to COMPLETED */
  @Prop({ type: Date, default: null })
  submittedAt!: Date | null;
}

export const FormSchema = SchemaFactory.createForClass(Form);

// ── Indexes ────────────────────────────────────────────────

/**
 * Partial unique index: only one in-progress form per user.
 * A user can have many completed forms but only one active draft.
 */
FormSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: FormStatus.IN_PROGRESS },
    name:   'unique_active_form_per_user',
  },
);

// Compound index for the listing endpoint
FormSchema.index({ userId: 1, updatedAt: -1 });
FormSchema.index({ userId: 1, status: 1, updatedAt: -1 });

// ── Virtuals ───────────────────────────────────────────────

/** Convenience: percentage of stages completed */
FormSchema.virtual('completionPercent').get(function (this: FormDocument) {
  return Math.round(((this.currentStage - 1) / 4) * 100);
});

/** Human-readable stage label */
FormSchema.virtual('currentStageLabel').get(function (this: FormDocument) {
  const labels: Record<number, string> = {
    1: 'Basic Information',
    2: 'Address Details',
    3: 'Professional Details',
    4: 'Document Upload',
    5: 'Review & Submit',
  };
  return labels[this.currentStage] ?? 'Unknown';
});