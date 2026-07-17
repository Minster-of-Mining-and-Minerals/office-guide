import { baseApi } from "../baseApi";
import type {
  Office,
  OfficeCreatePayload,
  OfficeListParams,
  OfficeUpdatePayload,
  Paginated,
} from "../types/signage";

type ListResponse = Paginated<Office>;

export const officeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffices: builder.query<ListResponse, OfficeListParams | void>({
      query: (params) => ({ url: "/offices", params: params ?? undefined }),
      transformResponse: (response: any): ListResponse => response.data,
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((o) => ({
                type: "Offices" as const,
                id: o.office_id,
              })),
              { type: "Offices" as const, id: "LIST" },
            ]
          : [{ type: "Offices" as const, id: "LIST" }],
    }),

    getAllOfficesByFloor: builder.query<Office[], string>({
      query: (floor_id) => ({
        url: "/offices",
        params: { all: true, floor_id, sort_by: "display_order", sort_order: "ASC" },
      }),
      transformResponse: (response: any): Office[] => response.data ?? [],
      providesTags: (_r, _e, floor_id) => [
        { type: "Offices" as const, id: `FLOOR-${floor_id}` },
      ],
    }),

    getOfficeById: builder.query<Office, string>({
      query: (id) => `/offices/${id}`,
      transformResponse: (response: any): Office => response.data,
      providesTags: (_r, _e, id) => [{ type: "Offices", id }],
    }),

    createOffice: builder.mutation<Office, OfficeCreatePayload>({
      query: (body) => ({ url: "/offices", method: "POST", body }),
      transformResponse: (response: any): Office => response.data,
      invalidatesTags: [
        { type: "Offices" as const, id: "LIST" },
        "SignageSummary",
      ],
    }),

    updateOffice: builder.mutation<
      Office,
      { id: string; data: OfficeUpdatePayload }
    >({
      query: ({ id, data }) => ({
        url: `/offices/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any): Office => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Offices", id },
        { type: "Offices", id: "LIST" },
      ],
    }),

    deleteOffice: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/offices/${id}`, method: "DELETE" }),
      transformResponse: (response: any) => response,
      invalidatesTags: [
        { type: "Offices" as const, id: "LIST" },
        "SignageSummary",
      ],
    }),

    reorderOffices: builder.mutation<
      { success: boolean; message: string },
      { floor_id: string; ordered_ids: string[] }
    >({
      query: (body) => ({
        url: "/offices/reorder",
        method: "PATCH",
        body,
      }),
      transformResponse: (response: any) => response,
      invalidatesTags: (_r, _e, { floor_id }) => [
        { type: "Offices" as const, id: "LIST" },
        { type: "Offices" as const, id: `FLOOR-${floor_id}` },
      ],
    }),
  }),
});

export const {
  useGetOfficesQuery,
  useGetAllOfficesByFloorQuery,
  useGetOfficeByIdQuery,
  useCreateOfficeMutation,
  useUpdateOfficeMutation,
  useDeleteOfficeMutation,
  useReorderOfficesMutation,
} = officeApi;
