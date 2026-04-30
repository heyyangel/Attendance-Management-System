import { api } from './api';

export const overtimeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyOvertimeRequests: builder.query({
      query: () => '/overtime/my',
      providesTags: ['Overtime'],
    }),
    requestOvertime: builder.mutation({
      query: (data) => ({
        url: '/overtime/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Overtime', 'Dashboard'],
    }),
    approveOvertime: builder.mutation({
      query: (id) => ({
        url: `/overtime/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Overtime', 'Dashboard'],
    }),
    rejectOvertime: builder.mutation({
      query: (id) => ({
        url: `/overtime/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Overtime', 'Dashboard'],
    }),
  }),
});

export const { 
  useGetMyOvertimeRequestsQuery, 
  useRequestOvertimeMutation,
  useApproveOvertimeMutation,
  useRejectOvertimeMutation
} = overtimeApi;
