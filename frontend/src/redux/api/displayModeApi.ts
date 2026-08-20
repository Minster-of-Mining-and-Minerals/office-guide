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
    getPublicDisplayMode: builder.query<DisplayMode, { floor_id?: string } | void>({
      query: (params) => ({ url: "/public/display-mode", params: params ?? undefined }),
      transformResponse: (r: ApiEnvelope<DisplayMode>) => r.data,
      providesTags: ["DisplayMode"],
    }),
    getAllDisplayModes: builder.query<Record<string, DisplayMode>, void>({
      query: () => ({ url: "/public/display-mode", params: { all: true } }),
      transformResponse: (r: ApiEnvelope<Record<string, DisplayMode>>) => r.data,
      providesTags: ["DisplayMode"],
    }),
    updateDisplayMode: builder.mutation<
      Record<string, DisplayMode>,
      Record<string, DisplayModeUpdatePayload>
    >({
      query: (body) => ({
        url: "/settings/display-mode",
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiEnvelope<Record<string, DisplayMode>>) => r.data,
      invalidatesTags: ["DisplayMode"],
    }),
    resetDisplayMode: builder.mutation<Record<string, DisplayMode>, void>({
      query: () => ({
        url: "/settings/display-mode",
        method: "DELETE",
      }),
      transformResponse: (r: ApiEnvelope<Record<string, DisplayMode>>) => r.data,
      invalidatesTags: ["DisplayMode"],
    }),
  }),
});

export const {
  useGetPublicDisplayModeQuery,
  useGetAllDisplayModesQuery,
  useUpdateDisplayModeMutation,
  useResetDisplayModeMutation,
} = displayModeApi;
