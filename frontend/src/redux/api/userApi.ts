import { baseApi } from "../baseApi";
import {
  UserType,
  UserPosition,
  User,
  CreateUserPayload,
  UpdateUserPayload,
  ToggleUserStatusPayload,
  PaginatedResponse,
  UserListParams,
} from "../types/user";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * GET ALL USERS (paginated)
     *
     * Returns the full `{ data, meta }` envelope so the list page can
     * render "Page X of Y" without keeping a separate count query in
     * sync. Callers pass `page`, `limit`, and optional filters.
     * --------------------------- */
    getUsers: builder.query<PaginatedResponse<User>, UserListParams | void>({
      query: (params) =>
        params ? { url: "/users", params } : { url: "/users" },
      // The controller already responds with the exact `PaginatedResponse`
      // shape, so we don't unwrap `.data` here — the list page needs the
      // meta block too.
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((u) => ({
                type: "User" as const,
                id: u.user_id,
              })),
              { type: "User" as const, id: "LIST" },
            ]
          : [{ type: "User" as const, id: "LIST" }],
    }),

    /** ---------------------------
     * GET USER BY ID
     * --------------------------- */
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      transformResponse: (response: any): User => response.data,
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),

    /** ---------------------------
     * GET CURRENT USER PROFILE
     * --------------------------- */
    getProfile: builder.query<User, void>({
      query: () => `/users/profile/me`,
      transformResponse: (response: any): User => response.data,
      providesTags: ["User"],
    }),

    /** ---------------------------
     * CREATE USER
     * --------------------------- */
    createUser: builder.mutation<User, CreateUserPayload>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      transformResponse: (response: any): User => response.data,
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    /** ---------------------------
     * UPDATE USER
     * --------------------------- */
    updateUser: builder.mutation<User, { id: string; data: UpdateUserPayload }>(
      {
        query: ({ id, data }) => ({
          url: `/users/${id}`,
          method: "PUT",
          body: data,
        }),
        transformResponse: (response: any): User => response.data,
        invalidatesTags: (_r, _e, { id }) => [
          { type: "User", id },
          { type: "User", id: "LIST" },
        ],
      }
    ),

    /** ---------------------------
     * DELETE USER (SOFT DELETE)
     * --------------------------- */
    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: any) => response,
      invalidatesTags: (_r, _e, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    /** ---------------------------
     * TOGGLE USER ACTIVE STATUS
     * --------------------------- */
    toggleUserStatus: builder.mutation<
      User,
      { id: string; data: ToggleUserStatusPayload }
    >({
      query: ({ id, data }) => ({
        url: `/users/${id}/toggle-status`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any): User => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    /** ---------------------------
     * RESET USER PASSWORD
     * --------------------------- */
    resetUserPassword: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}/reset-password`,
        method: "POST",
      }),
      transformResponse: (response: any) => response,
      invalidatesTags: (_r, _e, id) => [{ type: "User", id }],
    }),

    /** ---------------------------
     * GET USER TYPES
     * --------------------------- */
    getUserTypes: builder.query<UserType[], void>({
      query: () => "/users/types",
      transformResponse: (response: any): UserType[] => response.data ?? [],
      providesTags: ["User"],
    }),

    /** ---------------------------
     * GET USER POSITIONS
     * --------------------------- */
    getUserPositions: builder.query<UserPosition[], void>({
      query: () => "/users/positions",
      transformResponse: (response: any): UserPosition[] => response.data ?? [],
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetProfileQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useResetUserPasswordMutation,
  useGetUserTypesQuery,
  useGetUserPositionsQuery,
} = userApi;
