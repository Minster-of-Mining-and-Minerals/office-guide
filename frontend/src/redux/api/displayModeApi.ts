import { baseApi } from "../baseApi";
import type {
  DisplayMode,
  DisplayModeUpdatePayload,
} from "../types/signage";

type ApiEnvelope<T> = { success: true; data: T; message?: string };

/**
 * Display-mode setting exposed at `/api/public/display-mode`.
 *
 * The public /office-guide kiosk reads this on load and again whenever the
 * Socket.IO `signage:content:updated` event fires with
 * `scope: "display_mode"`, so admin changes propagate to every open kiosk
 * without a manual refresh.
 */
export const displayModeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicDisplayMode: builder.query<DisplayMode, void>({
      query: () => "/public/display-mode",
      transformResponse: (r: ApiEnvelope<DisplayMode>) => r.data,
      providesTags: ["DisplayMode"],
    }),
    updateDisplayMode: builder.mutation<
      DisplayMode,
      DisplayModeUpdatePayload
    >({
      query: (body) => ({
        url: "/settings/display-mode",
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiEnvelope<DisplayMode>) => r.data,
      invalidatesTags: ["DisplayMode"],
    }),
    resetDisplayMode: builder.mutation<DisplayMode, void>({
      query: () => ({
        url: "/settings/display-mode",
        method: "DELETE",
      }),
      transformResponse: (r: ApiEnvelope<DisplayMode>) => r.data,
      invalidatesTags: ["DisplayMode"],
    }),
  }),
});

export const {
  useGetPublicDisplayModeQuery,
  useUpdateDisplayModeMutation,
  useResetDisplayModeMutation,
} = displayModeApi;
