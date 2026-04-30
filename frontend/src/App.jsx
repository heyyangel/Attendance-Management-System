import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import EmployeeDashboard from './features/dashboard/EmployeeDashboard';
import PunchCard from './features/attendance/PunchCard';
import AttendanceHistory from './features/attendance/AttendanceHistory';
import Dashboard from './features/dashboard/Dashboard';
import ReportTable from './features/report/ReportTable';
import Login from './features/auth/Login';
import { logoutLocally } from './features/auth/authSlice';
import { useLogoutMutation, useGetUsersQuery, useSwitchRoleMutation } from './services/authApi';
import { LogOut } from 'lucide-react';
import UserManagement from './features/auth/UserManagement';

function App() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const userRole = user?.role?.toUpperCase();
  const isManagerOrAdmin = userRole === 'MANAGER' || userRole === 'ADMIN';

  const [activeTab, setActiveTab] = useState(isManagerOrAdmin ? 'DASHBOARD' : 'PUNCH');

  const [logoutApi] = useLogoutMutation();
  const [switchRole, { isLoading: isSwitching }] = useSwitchRoleMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(logoutLocally());
    }
  };

  const handleSwitchRole = async () => {
    const roles = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
    const nextRole = roles[(roles.indexOf(userRole) + 1) % roles.length];
    try {
      await switchRole(nextRole).unwrap();
    } catch (err) {
      console.error("Failed to switch role:", err);
    }
  };

  const getRoleColor = (role) => {
    if (role === 'ADMIN') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (role === 'MANAGER') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const NavButton = ({ id, label, activeColor }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 ${
        activeTab === id 
          ? `${activeColor} text-white shadow-lg` 
          : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {user ? (
        <div className="relative min-h-screen bg-dark-bg text-gray-300 font-sans">
          
          {/* Top Navigation Bar */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-white/5 p-1.5 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl">
            <NavButton id="PUNCH" label="Punch Card" activeColor="bg-blue-500" />
            <NavButton id="DASHBOARD" label="Dashboard" activeColor="bg-purple-500" />
            <NavButton id="HISTORY" label="History & OT" activeColor="bg-blue-500" />
            <NavButton id="REPORTS" label="Reports" activeColor="bg-emerald-500" />
            {userRole === 'ADMIN' && <NavButton id="USERS" label="Users" activeColor="bg-red-500" />}
          </div>

          {/* User Profile Badge */}
          <div className="absolute top-5 right-5 z-30 flex items-center gap-3 bg-dark-card/80 p-1.5 pr-4 rounded-xl border border-white/10 backdrop-blur-md shadow-xl">
            <button 
              onClick={handleSwitchRole}
              disabled={isSwitching}
              className="ml-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[0.6rem] font-bold text-slate-500 hover:text-primary transition-all border border-white/5 uppercase"
              title="Debug: Switch Role"
            >
              {isSwitching ? '...' : 'Switch'}
            </button>

            <div className="flex flex-col items-end px-2">
              <span className="text-sm font-semibold text-white leading-tight">{user.name}</span>
              <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${getRoleColor(userRole)}`}>
                {userRole}
              </span>
            </div>

            <div className="w-px h-8 bg-white/10"></div>

            <button 
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
          
          <div className="pt-24 pb-10 min-h-screen">
            {activeTab === 'PUNCH' && <PunchCard />}
            {activeTab === 'DASHBOARD' && (isManagerOrAdmin ? <Dashboard /> : <EmployeeDashboard />)}
            {activeTab === 'HISTORY' && <AttendanceHistory />}
            {activeTab === 'REPORTS' && <ReportTable />}
            {activeTab === 'USERS' && userRole === 'ADMIN' && <UserManagement />}
          </div>
        </div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;
