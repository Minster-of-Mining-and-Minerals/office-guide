import { baseApi } from "../baseApi";

/**
 * Global public theme — the office guide and every kiosk read this at load
 * time and re-read it whenever the admin changes a color (Socket.IO
 * `signage:content:updated` triggers a refetch on the public side).
 *
 * Values are always hex strings like `#14100a`. Keep this shape in lockstep
 * with the backend's `DEFAULT_THEME` in `settingsController.js`.
 */
export type PublicTheme = {
  /** Background of the page below the hero section. */
  page_bg: string;
  /** Surface color of each office card. */
  card_bg: string;
  /** Text color rendered on top of `card_bg`. */
  card_text: string;
  /** Accent color for pills, borders and hover glow. */
  accent: string;
  /** Deeper accent used for headings and strong labels on cards. */
  accent_dark: string;
};

/** Admin update payload — every field optional. */
export type ThemeUpdatePayload = Partial<PublicTheme>;

type ApiEnvelope<T> = { success: true; data: T; message?: string };

export const themeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicTheme: builder.query<PublicTheme, void>({
      query: () => "/public/theme",
      transformResponse: (r: ApiEnvelope<PublicTheme>) => r.data,
      providesTags: ["Theme"],
    }),
    updateTheme: builder.mutation<PublicTheme, ThemeUpdatePayload>({
      query: (body) => ({
        url: "/settings/theme",
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiEnvelope<PublicTheme>) => r.data,
      invalidatesTags: ["Theme"],
    }),
    resetTheme: builder.mutation<PublicTheme, void>({
      query: () => ({
        url: "/settings/theme",
        method: "DELETE",
      }),
      transformResponse: (r: ApiEnvelope<PublicTheme>) => r.data,
      invalidatesTags: ["Theme"],
    }),
  }),
});

export const {
  useGetPublicThemeQuery,
  useUpdateThemeMutation,
  useResetThemeMutation,
} = themeApi;
