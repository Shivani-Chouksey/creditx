import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { Request } from 'express';

// ─────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────

export const DOCUMENTS_UPLOAD_DIR = join(process.cwd(), 'uploads', 'documents');
export const MAX_FILE_SIZE_BYTES  = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_COUNT       = 5;
export const MIN_FILE_COUNT       = 2;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',                                                      // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpeg',
  '.jpg',
  '.png',
  '.doc',
  '.docx',
]);

// ─────────────────────────────────────────────────────────
//  MULTER OPTIONS
// ─────────────────────────────────────────────────────────

export const documentMulterConfig: MulterOptions = {
  storage: diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
      // Create directory on first upload if it doesn't exist
      if (!existsSync(DOCUMENTS_UPLOAD_DIR)) {
        mkdirSync(DOCUMENTS_UPLOAD_DIR, { recursive: true });
      }
      cb(null, DOCUMENTS_UPLOAD_DIR);
    },

    filename: (_req: Request, file: Express.Multer.File, cb) => {
      // uuid + original extension — prevents collisions and path traversal
      const ext       = extname(file.originalname).toLowerCase();
      const safeName  = `${uuid()}${ext}`;
      cb(null, safeName);
    },
  }),

  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const ext = extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new BadRequestException(
          `"${file.originalname}" has an unsupported type. ` +
          `Allowed: PDF, JPEG, PNG, DOC, DOCX.`,
        ),
        false,
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files:    MAX_FILE_COUNT,
  },
};

// ─────────────────────────────────────────────────────────
//  HELPER – map Multer file → stored shape
// ─────────────────────────────────────────────────────────

export function mapMulterFileToSchema(file: Express.Multer.File) {
  return {
    originalName: file.originalname,
    storedName:   file.filename,
    publicPath:   `/uploads/documents/${file.filename}`,
    mimetype:     file.mimetype,
    size:         file.size,
    uploadedAt:   new Date(),
  };
}