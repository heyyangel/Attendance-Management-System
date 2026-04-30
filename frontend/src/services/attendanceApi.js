import { api } from './api';

export const attendanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTodayStatus: builder.query({
      query: () => '/attendance/today',
      providesTags: ['Attendance'],
    }),
    getMyAttendance: builder.query({
      query: () => '/attendance/my',
      providesTags: ['Attendance'],
    }),
    punchIn: builder.mutation({
      query: (data) => ({
        url: '/attendance/punch-in',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    punchOut: builder.mutation({
      query: (data) => ({
        url: '/attendance/punch-out',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    getAttendanceForReview: builder.query({
      query: () => '/attendance/review',
      providesTags: ['Attendance'],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/attendance/${id}/validate`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    getAttendanceReport: builder.query({
      query: ({ page = 1, limit = 10, startDate = '', endDate = '' }) => 
        `/attendance/report?page=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetTodayStatusQuery,
  useGetMyAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetAttendanceForReviewQuery,
  useValidateAttendanceMutation,
  useGetAttendanceReportQuery,
} = attendanceApi;
