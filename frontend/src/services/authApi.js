import { api } from './api';

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    switchRole: builder.mutation({
      query: (role) => ({
        url: '/auth/switch-role',
        method: 'PATCH',
        body: { role },
      }),
    }),
    getUsers: builder.query({
      query: () => '/auth/users',
    }),
  }),
});


export const { useLoginMutation, useSignupMutation, useLogoutMutation, useSwitchRoleMutation, useGetUsersQuery } = authApi;
