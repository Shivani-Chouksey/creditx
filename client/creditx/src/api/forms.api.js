import { apiClient } from "../../apiClient";
import { API_URLS } from "../../api_endpoints";

/**
 * All stage endpoints require multipart/form-data.
 * This helper converts a plain object into FormData, properly
 * handling arrays (repeated field names) and File/FileList values.
 */
const toFormData = (payload = {}) => {
  const fd = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === "") return;
        fd.append(key, item);
      });
      return;
    }

    if (value instanceof FileList) {
      Array.from(value).forEach((file) => fd.append(key, file));
      return;
    }

    fd.append(key, value);
  });

  return fd;
};

const unwrap = (res) => res.data?.data ?? res.data;

export const formsApi = {
  // ── Stages ───────────────────────────────────────────────
  async saveStage1(values) {
    const res = await apiClient.post(API_URLS.FORMS.STAGE1, toFormData(values));
    return unwrap(res);
  },

  async saveStage2(values) {
    const res = await apiClient.post(API_URLS.FORMS.STAGE2, toFormData(values));
    return unwrap(res);
  },

  async saveStage3(values) {
    const res = await apiClient.post(API_URLS.FORMS.STAGE3, toFormData(values));
    return unwrap(res);
  },

  async saveStage4({ documents = [], notes }) {
    const fd = new FormData();
    Array.from(documents).forEach((file) => fd.append("documents", file));
    if (notes) fd.append("notes", notes);
    const res = await apiClient.post(API_URLS.FORMS.STAGE4, fd);
    return unwrap(res);
  },

  async saveStage5(values) {
    const res = await apiClient.post(API_URLS.FORMS.STAGE5, toFormData(values));
    return unwrap(res);
  },

  // ── Reads ────────────────────────────────────────────────
  async getResume() {
    const res = await apiClient.get(API_URLS.FORMS.RESUME);
    return unwrap(res);
  },

  async listForms(query = {}) {
    const res  = await apiClient.get(API_URLS.FORMS.LIST, { params: query });
    const body = res.data ?? {};

    // Server envelope: { success, statusCode, message, data: [...], meta: {...} }
    // We read data + meta directly from the envelope (unwrap() would
    // drop the meta).
    const data = Array.isArray(body.data) ? body.data : [];

    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 10;

    const meta = body.meta ?? {
      total:       data.length,
      page,
      limit,
      totalPages:  Math.max(1, Math.ceil(data.length / limit)),
      hasNextPage: false,
      hasPrevPage: page > 1,
    };

    return { data, meta };
  },

  async getFormById(id) {
    const res = await apiClient.get(API_URLS.FORMS.BY_ID(id));
    return unwrap(res);
  },

  // ── Mutations ────────────────────────────────────────────
  /**
   * Walk the paginated list endpoint until the server returns fewer rows
   * than the page size, collecting everything.  Caps at `maxPages` so a
   * broken server can't spin forever.
   *
   * The backend DTO enforces `@Max(50)` on `limit`, so don't raise it.
   */
  async listAllForms({ pageSize = 50, maxPages = 20, ...filters } = {}) {
    const all = [];
    for (let page = 1; page <= maxPages; page++) {
      const res = await this.listForms({ ...filters, page, limit: pageSize });
      const batch = Array.isArray(res?.data) ? res.data : [];
      all.push(...batch);
      if (batch.length < pageSize) break;
    }
    return all;
  },

  async removeDocument(formId, index) {
    const res = await apiClient.delete(
      API_URLS.FORMS.REMOVE_DOCUMENT(formId, index),
    );
    return unwrap(res);
  },
};
