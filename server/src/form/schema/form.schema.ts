import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FormDocument = Form & Document;


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


@Schema({
  collection: 'forms',
  timestamps: true,
  toJSON: {
    virtuals: true,
   
  },
})
export class Form {
  
  @Prop({
    type:     Types.ObjectId,
    ref:      'User',
    required: true,
    index:    true,
  })
  userId!: Types.ObjectId;
  
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

// Non-unique: users may have multiple in-progress drafts at once.
// Each stage save targets a specific form by formId, so there is no
// ambiguity when several drafts coexist.
FormSchema.index(
  { userId: 1, status: 1 },
  { name: 'user_status_idx' },
);

// Compound index for the listing endpoint
FormSchema.index({ userId: 1, updatedAt: -1 });
FormSchema.index({ userId: 1, status: 1, updatedAt: -1 });


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
