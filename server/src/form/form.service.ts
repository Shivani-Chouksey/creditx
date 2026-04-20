import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { SortOrder as MongooseSortOrder } from 'mongoose';
import { unlink } from 'fs/promises';
import { join } from 'path';

import { Form, FormDocument, FormStage, FormStatus } from './schema/form.schema';
import { Stage1Dto }          from './dto/stage1.dto';
import { Stage2Dto }          from './dto/stage2.dto';
import { Stage3Dto }          from './dto/stage3.dto';
import { Stage4Dto }          from './dto/stage4.dto';
import { Stage5Dto }          from './dto/stage5.dto';
import { FormListQueryDto, SortOrder } from './dto/form-list-query.dto';
import {
  DOCUMENTS_UPLOAD_DIR,
  MIN_FILE_COUNT,
  mapMulterFileToSchema,
} from '../../multer.config';

// ─────────────────────────────────────────────────────────
//  RESPONSE SHAPES
// ─────────────────────────────────────────────────────────

export interface PaginatedFormsResult {
  data:  FormDocument[];
  meta: {
    total:       number;
    page:        number;
    limit:       number;
    totalPages:  number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ResumeInfo {
  hasActiveForm:     boolean;
  currentStage:     number;
  currentStageLabel: string;
  formId:           string | null;
  completionPercent: number;
}

// ─────────────────────────────────────────────────────────
//  SERVICE
// ─────────────────────────────────────────────────────────

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    @InjectModel(Form.name)
    private readonly formModel: Model<FormDocument>,
  ) {}

  // ═══════════════════════════════════════════════════════
  //  STAGE HANDLERS
  // ═══════════════════════════════════════════════════════

  /**
   * Stage 1 — Basic Information
   * Creates a new form draft if none is in-progress;
   * otherwise updates the existing draft.
   */
  async saveStage1(userId: string, dto: Stage1Dto): Promise<FormDocument> {
    const form = await this.getOrCreateDraft(userId);

    form.basicInfo = {
      fullName:    dto.fullName,
      email:       dto.email,
      phone:       dto.phone,
      dateOfBirth: dto.dateOfBirth ?? null,
      gender:      dto.gender     ?? null,
    };

    // Advance the saved stage pointer (never go backwards)
    form.currentStage = this.advanceStage(form.currentStage, FormStage.ADDRESS);

    return this.saveSafely(form, 'stage-1');
  }

  /**
   * Stage 2 — Address Details
   * Requires stage 1 to be completed first.
   */
  async saveStage2(userId: string, dto: Stage2Dto): Promise<FormDocument> {
    const form = await this.getDraft(userId);
    this.requirePriorStage(form, FormStage.BASIC_INFO, 'Stage 1 (Basic Information)');

    form.addressDetails = {
      street:       dto.street,
      addressLine2: dto.addressLine2 ?? null,
      city:         dto.city,
      state:        dto.state,
      postalCode:   dto.postalCode,
      country:      dto.country,
    };
    form.currentStage = this.advanceStage(form.currentStage, FormStage.PROFESSIONAL);

    return this.saveSafely(form, 'stage-2');
  }

  /**
   * Stage 3 — Professional Details
   * Requires stages 1 & 2 to be completed.
   */
  async saveStage3(userId: string, dto: Stage3Dto): Promise<FormDocument> {
    const form = await this.getDraft(userId);
    this.requirePriorStage(form, FormStage.ADDRESS, 'Stage 2 (Address Details)');

    form.professionalDetails = {
      companyName:       dto.companyName,
      jobTitle:          dto.jobTitle,
      yearsOfExperience: dto.yearsOfExperience,
      skills:            dto.skills           ?? [],
      linkedinUrl:       dto.linkedinUrl      ?? null,
      bio:               dto.bio              ?? null,
    };
    form.currentStage = this.advanceStage(form.currentStage, FormStage.DOCUMENTS);

    return this.saveSafely(form, 'stage-3');
  }

  /**
   * Stage 4 — Document Upload
   *
   * - Requires stage 3 completed.
   * - At least MIN_FILE_COUNT (2) files must be uploaded.
   * - Files are appended so a user can re-upload without losing
   *   previously submitted documents.
   * - Rolls back uploaded files if validation fails.
   */
  async saveStage4(
    userId: string,
    files: Express.Multer.File[],
    dto:   Stage4Dto,
  ): Promise<FormDocument> {
    // Guard: validate files before touching DB
    if (!files || files.length < MIN_FILE_COUNT) {
      // Clean up any partially saved files
      await this.deleteFilesFromDisk(files?.map((f) => f.path) ?? []);
      throw new BadRequestException(
        `At least ${MIN_FILE_COUNT} documents are required (received ${files?.length ?? 0}).`,
      );
    }

    let form: FormDocument;
    try {
      form = await this.getDraft(userId);
    } catch (err) {
      await this.deleteFilesFromDisk(files.map((f) => f.path));
      throw err;
    }

    if (!form.professionalDetails) {
      await this.deleteFilesFromDisk(files.map((f) => f.path));
      throw new BadRequestException(
        'Please complete Stage 3 (Professional Details) before uploading documents.',
      );
    }

    // Append — do not overwrite so the user can add more files
    form.documents.push(...files.map(mapMulterFileToSchema));
    form.currentStage = this.advanceStage(form.currentStage, FormStage.REVIEW_SUBMIT);

    return this.saveSafely(form, 'stage-4');
  }

  /**
   * Stage 5 — Review & Submit
   *
   * Validates that ALL prior stages are filled before marking COMPLETED.
   */
  async saveStage5(userId: string, dto: Stage5Dto): Promise<FormDocument> {
    const form = await this.getDraft(userId);
    this.assertAllStagesComplete(form);

    form.reviewNotes  = dto.reviewNotes ?? null;
    form.status       = FormStatus.COMPLETED;
    form.submittedAt  = new Date();
    form.currentStage = FormStage.REVIEW_SUBMIT;

    return this.saveSafely(form, 'stage-5');
  }

  // ═══════════════════════════════════════════════════════
  //  READ OPERATIONS
  // ═══════════════════════════════════════════════════════

  /** Resume support: tells the frontend which stage to navigate to */
  async getResumeInfo(userId: string): Promise<ResumeInfo> {
    const form = await this.formModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: FormStatus.IN_PROGRESS,
      })
      .lean()
      .exec();

    if (!form) {
      return {
        hasActiveForm:     false,
        currentStage:     1,
        currentStageLabel: 'Basic Information',
        formId:           null,
        completionPercent: 0,
      };
    }

    const stageLabels: Record<number, string> = {
      1: 'Basic Information',
      2: 'Address Details',
      3: 'Professional Details',
      4: 'Document Upload',
      5: 'Review & Submit',
    };

    return {
      hasActiveForm:     true,
      currentStage:     form.currentStage,
      currentStageLabel: stageLabels[form.currentStage],
      formId:           String(form._id),
      completionPercent: Math.round(((form.currentStage - 1) / 4) * 100),
    };
  }

  /** Paginated list with filtering + sorting */
  async listForms(
    userId:  string,
    query:   FormListQueryDto,
  ): Promise<PaginatedFormsResult> {
    const {
      page      = 1,
      limit     = 10,
      status,
      stage,
      sortBy    = 'updatedAt',
      sortOrder = SortOrder.DESC,
      search,
    } = query;

    const skip = (page - 1) * limit;

    // ── Build dynamic filter ────────────────────────────
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (status) filter.status       = status;
    if (stage)  filter.currentStage = stage;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or  = [
        { 'basicInfo.fullName': regex },
        { 'basicInfo.email':    regex },
      ];
    }

    // ── Sort ───────────────────────────────────────────
    const sort: Record<string, MongooseSortOrder> = {
      [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    };

    // ── Execute count + data in parallel ───────────────
    const [data, total] = await Promise.all([
      this.formModel
        .find(filter)
        .select([
          'userId',
          'currentStage',
          'status',
          'submittedAt',
          'createdAt',
          'updatedAt',
          'basicInfo.fullName',
          'basicInfo.email',
          // Count documents but don't return file paths
          'documents.originalName',
          'documents.mimetype',
          'documents.size',
          'documents.uploadedAt',
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),

      this.formModel.countDocuments(filter).exec(),
    ]);

    return {
      data: data as FormDocument[],
      meta: {
        total,
        page,
        limit,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  /** Get the full detail of a single form — ownership checked */
  async getFormById(formId: string, userId: string): Promise<FormDocument> {
    return this.getOwnedForm(formId, userId);
  }

  // ═══════════════════════════════════════════════════════
  //  DOCUMENT MANAGEMENT
  // ═══════════════════════════════════════════════════════

  /**
   * Remove a specific uploaded document by index.
   * Deletes from disk and from the form record atomically.
   */
  async removeDocument(
    formId:        string,
    documentIndex: number,
    userId:        string,
  ): Promise<FormDocument> {
    const form = await this.getOwnedForm(formId, userId);

    if (documentIndex < 0 || documentIndex >= form.documents.length) {
      throw new BadRequestException(
        `Invalid document index ${documentIndex}. Form has ${form.documents.length} document(s).`,
      );
    }

    const [removed] = form.documents.splice(documentIndex, 1);
    form.markModified('documents'); // Mongoose needs this for array mutations

    // Delete from disk (fire-and-forget — don't fail the request)
    this.deleteFilesFromDisk([
      join(DOCUMENTS_UPLOAD_DIR, removed.storedName),
    ]).catch((err) =>
      this.logger.warn(`Could not delete file ${removed.storedName}: ${err.message}`),
    );

    return this.saveSafely(form, 'remove-document');
  }

  // ═══════════════════════════════════════════════════════
  //  PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════

  /**
   * Get the in-progress draft for a user, or create one if none exists.
   */
  private async getOrCreateDraft(userId: string): Promise<FormDocument> {
    const existing = await this.formModel.findOne({
      userId: new Types.ObjectId(userId),
      status: FormStatus.IN_PROGRESS,
    });

    if (existing) return existing;

    return this.formModel.create({
      userId:       new Types.ObjectId(userId),
      currentStage: FormStage.BASIC_INFO,
      status:       FormStatus.IN_PROGRESS,
    });
  }

  /**
   * Get the in-progress draft — throws 404 if not found.
   */
  private async getDraft(userId: string): Promise<FormDocument> {
    const form = await this.formModel.findOne({
      userId: new Types.ObjectId(userId),
      status: FormStatus.IN_PROGRESS,
    });

    if (!form) {
      throw new NotFoundException(
        'No active form found. Please start from Stage 1.',
      );
    }

    return form;
  }

  /**
   * Get any form by id and enforce ownership.
   */
  private async getOwnedForm(
    formId: string,
    userId: string,
  ): Promise<FormDocument> {
    const form = await this.formModel.findById(formId);

    if (!form) {
      throw new NotFoundException(`Form with id "${formId}" not found.`);
    }

    if (form.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this form.');
    }

    return form;
  }

  /**
   * Returns the new currentStage — only advances, never goes backward.
   * e.g. if user re-submits stage 1 while on stage 4, keep stage 4.
   */
  private advanceStage(current: number, next: FormStage): number {
    return Math.max(current, next);
  }

  /**
   * Throw 400 if the required prior stage data is missing.
   */
  private requirePriorStage(
    form:          FormDocument,
    requiredStage: FormStage,
    stageLabel:    string,
  ): void {
    const stageDataMap: Record<FormStage, unknown> = {
      [FormStage.BASIC_INFO]:    form.basicInfo,
      [FormStage.ADDRESS]:       form.addressDetails,
      [FormStage.PROFESSIONAL]:  form.professionalDetails,
      [FormStage.DOCUMENTS]:     form.documents?.length,
      [FormStage.REVIEW_SUBMIT]: form.submittedAt,
    };

    if (!stageDataMap[requiredStage]) {
      throw new BadRequestException(
        `You must complete ${stageLabel} before proceeding.`,
      );
    }
  }

  /**
   * Validate that ALL stages have been filled before final submission.
   */
  private assertAllStagesComplete(form: FormDocument): void {
    const incomplete: string[] = [];

    if (!form.basicInfo)            incomplete.push('Stage 1 — Basic Information');
    if (!form.addressDetails)       incomplete.push('Stage 2 — Address Details');
    if (!form.professionalDetails)  incomplete.push('Stage 3 — Professional Details');
    if (!form.documents?.length)    incomplete.push('Stage 4 — Document Upload');

    if (incomplete.length > 0) {
      throw new BadRequestException(
        `Cannot submit — the following stages are incomplete: ${incomplete.join('; ')}`,
      );
    }
  }

  /**
   * save() with structured error logging.
   */
  private async saveSafely(
    form:  FormDocument,
    stage: string,
  ): Promise<FormDocument> {
    try {
      return await form.save();
    } catch (err) {
      // this.logger.error(`Error saving form at ${stage}: ${err.message}`, err.stack);
      throw new InternalServerErrorException(
        'Could not save your progress. Please try again.',
      );
    }
  }

  /**
   * Delete an array of absolute file paths from disk.
   * Errors are swallowed — we don't want a missing file to break an API call.
   */
  private async deleteFilesFromDisk(paths: string[]): Promise<void> {
    await Promise.allSettled(
      paths.map((p) =>
        unlink(p).catch((err) =>
          this.logger.warn(`File not deleted (${p}): ${err.message}`),
        ),
      ),
    );
  }
}