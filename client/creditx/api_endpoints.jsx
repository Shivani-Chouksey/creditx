export const API_URLS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN:    "/auth/login",
    REFRESH:  "/auth/refresh",
    LOGOUT:   "/auth/logout",
  },

  FORMS: {
    LIST:   "/forms",
    RESUME: "/forms/resume",
    BY_ID:  (id) => `/forms/${id}`,

    STAGE1: "/forms/stage-1",
    STAGE2: "/forms/stage-2",
    STAGE3: "/forms/stage-3",
    STAGE4: "/forms/stage-4",
    STAGE5: "/forms/stage-5",

    REMOVE_DOCUMENT: (id, index) => `/forms/${id}/documents/${index}`,
  },
};
