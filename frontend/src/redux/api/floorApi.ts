import { baseApi } from "../baseApi";
import type {
  Floor,
  FloorCreatePayload,
  FloorListParams,
  FloorUpdatePayload,
  Paginated,
} from "../types/signage";

type ListResponse = Paginated<Floor>;

export const floorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFloors: builder.query<ListResponse, FloorListParams | void>({
      query: (params) => ({ url: "/floors", params: params ?? undefined }),
      transformResponse: (response: any): ListResponse => response.data,
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map((f) => ({
                type: "Floors" as const,
                id: f.floor_id,
              })),
              { type: "Floors" as const, id: "LIST" },
            ]
          : [{ type: "Floors" as const, id: "LIST" }],
    }),

    getAllFloors: builder.query<Floor[], void>({
      query: () => ({ url: "/floors", params: { all: true } }),
      transformResponse: (response: any): Floor[] => response.data ?? [],
      providesTags: [{ type: "Floors" as const, id: "ALL" }],
    }),

    getFloorById: builder.query<Floor, string>({
      query: (id) => `/floors/${id}`,
      transformResponse: (response: any): Floor => response.data,
      providesTags: (_r, _e, id) => [{ type: "Floors", id }],
    }),

    createFloor: builder.mutation<Floor, FloorCreatePayload>({
      query: (body) => ({ url: "/floors", method: "POST", body }),
      transformResponse: (response: any): Floor => response.data,
      invalidatesTags: [
        { type: "Floors" as const, id: "LIST" },
        { type: "Floors" as const, id: "ALL" },
        "SignageSummary",
      ],
    }),

    updateFloor: builder.mutation<
      Floor,
      { id: string; data: FloorUpdatePayload }
    >({
      query: ({ id, data }) => ({ url: `/floors/${id}`, method: "PATCH", body: data }),
      transformResponse: (response: any): Floor => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Floors", id },
        { type: "Floors", id: "LIST" },
        { type: "Floors", id: "ALL" },
      ],
    }),

    deleteFloor: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/floors/${id}`, method: "DELETE" }),
      transformResponse: (response: any) => response,
      invalidatesTags: [
        { type: "Floors" as const, id: "LIST" },
        { type: "Floors" as const, id: "ALL" },
        "SignageSummary",
      ],
    }),
  }),
});

export const {
  useGetFloorsQuery,
  useGetAllFloorsQuery,
  useGetFloorByIdQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
} = floorApi;
