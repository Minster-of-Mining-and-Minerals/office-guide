import { baseApi } from "../baseApi";
import type {
  Announcement,
  AnnouncementListParams,
  Paginated,
  PublicAnnouncementsPayload,
} from "../types/signage";

type ListResponse = Paginated<Announcement>;

/**
 * Create/update payload used by the admin UI. The `media` field carries the
 * uploaded image or video and is submitted as `multipart/form-data`; every
 * other field is optional on update. RTK Query correctly omits the
 * `content-type` header when the body is a `FormData`, so the browser adds
 * the multipart boundary itself.
 */
export interface AnnouncementFormValues {
  title: string;
  message?: string | null;
  duration_seconds?: number;
  audio_enabled?: boolean;
  is_visible?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  /** Required on create, optional on update. */
  media?: File | null;
}

/**
 * Convert plain object → FormData. Nulls / undefined values are stripped so
 * a PATCH with only `{ is_visible: true }` doesn't accidentally clear the
 * other fields on the server.
 */
function toFormData(values: AnnouncementFormValues): FormData {
  const fd = new FormData();
  for (const [key, val] of Object.entries(values)) {
    if (val === undefined || val === null) continue;
    if (key === "media" && val instanceof File) {
      fd.append("media", val);
      continue;
    }
    if (typeof val === "boolean") {
      fd.append(key, val ? "true" : "false");
      continue;
    }
    fd.append(key, String(val));
  }
  return fd;
}

export const announcementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<
      ListResponse,
      AnnouncementListParams | void
    >({
      query: (params) => ({
        url: "/announcements",
        params: params ?? undefined,
      }),
      transformResponse: (response: any): ListResponse => response.data,
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((a) => ({
                type: "Announcements" as const,
                id: a.announcement_id,
              })),
              { type: "Announcements" as const, id: "LIST" },
            ]
          : [{ type: "Announcements" as const, id: "LIST" }],
    }),

    getAllAnnouncements: builder.query<Announcement[], void>({
      query: () => ({ url: "/announcements", params: { all: true } }),
      transformResponse: (response: any): Announcement[] =>
        response.data ?? [],
      providesTags: [{ type: "Announcements" as const, id: "ALL" }],
    }),

    getAnnouncementById: builder.query<Announcement, string>({
      query: (id) => `/announcements/${id}`,
      transformResponse: (response: any): Announcement => response.data,
      providesTags: (_r, _e, id) => [{ type: "Announcements", id }],
    }),

    createAnnouncement: builder.mutation<
      Announcement,
      AnnouncementFormValues
    >({
      query: (values) => ({
        url: "/announcements",
        method: "POST",
        body: toFormData(values),
      }),
      transformResponse: (response: any): Announcement => response.data,
      invalidatesTags: [
        { type: "Announcements" as const, id: "LIST" },
        { type: "Announcements" as const, id: "ALL" },
      ],
    }),

    updateAnnouncement: builder.mutation<
      Announcement,
      { id: string; data: AnnouncementFormValues }
    >({
      query: ({ id, data }) => ({
        url: `/announcements/${id}`,
        method: "PATCH",
        body: toFormData(data),
      }),
      transformResponse: (response: any): Announcement => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Announcements", id },
        { type: "Announcements", id: "LIST" },
        { type: "Announcements", id: "ALL" },
      ],
    }),

    reorderAnnouncements: builder.mutation<
      { success: boolean; message: string },
      { ordered_ids: string[] }
    >({
      query: (body) => ({
        url: "/announcements/reorder",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response,
      invalidatesTags: [
        { type: "Announcements" as const, id: "LIST" },
        { type: "Announcements" as const, id: "ALL" },
      ],
    }),

    bulkSetAnnouncementVisibility: builder.mutation<
      { success: boolean; message: string; data: { affected: number } },
      { ids: string[]; is_visible: boolean }
    >({
      query: (body) => ({
        url: "/announcements/bulk-visibility",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response,
      invalidatesTags: [
        { type: "Announcements" as const, id: "LIST" },
        { type: "Announcements" as const, id: "ALL" },
        { type: "Announcements" as const, id: "PUBLIC" },
      ],
    }),

    deleteAnnouncement: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/announcements/${id}`, method: "DELETE" }),
      transformResponse: (response: any) => response,
      invalidatesTags: [
        { type: "Announcements" as const, id: "LIST" },
        { type: "Announcements" as const, id: "ALL" },
      ],
    }),

    getPublicAnnouncements: builder.query<PublicAnnouncementsPayload, { floor_id?: string } | void>({
      query: (params) => ({
        url: "/public/announcements",
        params: params ?? undefined,
      }),
      transformResponse: (response: any): PublicAnnouncementsPayload =>
        response.data,
      providesTags: [{ type: "Announcements" as const, id: "PUBLIC" }],
    }),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useGetAllAnnouncementsQuery,
  useGetAnnouncementByIdQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useReorderAnnouncementsMutation,
  useBulkSetAnnouncementVisibilityMutation,
  useDeleteAnnouncementMutation,
  useGetPublicAnnouncementsQuery,
} = announcementApi;
