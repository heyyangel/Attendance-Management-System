import { api } from './api';

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeDashboard: builder.query({
      query: () => '/dashboard/employee',
      providesTags: ['Dashboard', 'Attendance', 'Overtime'],
    }),
    getManagerDashboard: builder.query({
      query: () => '/dashboard/manager',
      providesTags: ['Dashboard'],
    }),
    getAdminDashboard: builder.query({
      query: () => '/dashboard/admin',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetEmployeeDashboardQuery, useGetManagerDashboardQuery, useGetAdminDashboardQuery } = dashboardApi;
