import React from 'react';
import { useGetUsersQuery } from '../../services/authApi';
import { Users, Mail, Shield, Hash, Loader2, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const { data: response, isLoading, error } = useGetUsersQuery();
  const users = response?.data || [];

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={32} /></div>;

  if (error) return (
    <div className="flex justify-center items-center p-10">
      <div className="glass-card p-10 text-center max-w-md w-full border-red-500/20">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4"/>
        <h3 className="text-xl font-bold text-white mb-2">Error Loading Users</h3>
        <p className="text-slate-400 text-sm">{error?.data?.message || 'Failed to fetch user list'}</p>
      </div>
    </div>
  );

  const getRoleBadge = (role) => {
    const roles = {
      ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
      MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      EMPLOYEE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
    return roles[role?.toUpperCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-dark-border bg-white/[0.02] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="text-primary" size={24} /> User Management
            </h2>
            <p className="text-slate-400 text-sm mt-1">Total {users.length} registered employees in the system.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-bg/50 text-[0.65rem] uppercase tracking-wider text-slate-500 border-b border-dark-border">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold text-center">Employee ID</th>
                <th className="p-4 font-semibold text-center">Department</th>
                <th className="p-4 font-semibold text-center">Role</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center font-bold text-slate-300 group-hover:border-primary/50 transition-colors">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{u.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-mono text-slate-300 bg-dark-bg px-2 py-1 rounded border border-dark-border">
                      {u.employeeId}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm text-slate-400">
                    {u.department || 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold border ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                      <span className={`text-[0.65rem] font-bold ${u.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
