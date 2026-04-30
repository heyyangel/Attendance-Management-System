import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetManagerDashboardQuery, useGetAdminDashboardQuery } from '../../services/dashboardApi';
import { useValidateAttendanceMutation } from '../../services/attendanceApi';
import { useApproveOvertimeMutation, useRejectOvertimeMutation } from '../../services/overtimeApi';
import { Users, Clock, AlertTriangle, ShieldAlert, Eye, CheckCircle, XCircle, Download, Check, X, Loader2 } from 'lucide-react';

const MetricCard = ({ label, value, trend, icon: Icon, colorClass, trendClass }) => (
  <div className="glass-card p-5 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity ${colorClass.bg}`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <span className="text-[0.65rem] font-bold text-gray-400 tracking-widest uppercase">{label}</span>
        <div className="text-3xl font-bold text-white mt-1 mb-1">{value}</div>
        <span className={`text-xs font-semibold ${trendClass}`}>{trend}</span>
      </div>
      <div className={`p-2.5 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const user = useSelector(state => state.auth.user);
  const userRole = user?.role?.toUpperCase();
  const isManager = userRole === 'MANAGER';
  const isAdmin = userRole === 'ADMIN';

  const managerData = useGetManagerDashboardQuery(undefined, { skip: !isManager });
  const adminData = useGetAdminDashboardQuery(undefined, { skip: !isAdmin });
  
  const dashboardState = isManager ? managerData : adminData;
  const stats = dashboardState?.data?.data || {};

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [validateAttendance] = useValidateAttendanceMutation();
  const [approveOvertime] = useApproveOvertimeMutation();
  const [rejectOvertime] = useRejectOvertimeMutation();

  const handleValidate = async (id, status) => {
    try {
      await validateAttendance({ id, validationStatus: status, remarks }).unwrap();
      setSelectedRecord(null);
      setRemarks('');
    } catch (err) {
      alert("Failed to validate attendance");
    }
  };

  const handleApproveOT = async (id) => {
    try { await approveOvertime(id).unwrap(); } 
    catch (e) { alert("Failed to approve overtime"); }
  };

  const handleRejectOT = async (id) => {
    try { await rejectOvertime(id).unwrap(); } 
    catch (e) { alert("Failed to reject overtime"); }
  };

  const handleExportCSV = () => {
    if (!todaysAttendance.length) return alert("No data to export");
    const headers = ["Employee", "Date", "Punch In", "Punch Out", "Hours", "Location", "Status", "Validation"];
    const rows = todaysAttendance.map(r => [
      r.user?.name,
      new Date(r.date).toLocaleDateString(),
      new Date(r.punchInTime).toLocaleTimeString(),
      r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : '—',
      r.workingHours || 0,
      r.locationName || 'GPS',
      r.shiftStatus,
      r.validationStatus
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!todaysAttendance.length) return alert("No data to export");
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Attendance Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2dd4bf; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border: 1px solid #eee; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border: 1px solid #eee; font-size: 13px; }
            .selfie { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; background: #eee; }
            .status { font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 99px; display: inline-block; }
            .status-valid { background: #dcfce7; color: #166534; }
            .summary { margin-top: 30px; display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; }
            .stat-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Attendance</div>
              <div style="font-size: 14px; color: #666; margin-top: 5px;">Daily Operations Report</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold;">Date: ${new Date().toLocaleDateString()}</div>
              <div style="font-size: 12px; color: #666;">Generated by: ${user.name}</div>
            </div>
          </div>

          <div class="summary">
            <div class="stat-box"><strong>Total Present:</strong> ${todaysAttendance.length}</div>
            <div class="stat-box"><strong>Avg Hours:</strong> ${avgHours}h</div>
            <div class="stat-box"><strong>Validation:</strong> Verified</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Employee</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${todaysAttendance.map(r => `
                <tr>
                  <td><img src="${r.punchInImage || ''}" class="selfie" /></td>
                  <td><strong>${r.user?.name}</strong><br/><small>${r.locationName || 'GPS Location'}</small></td>
                  <td>${new Date(r.punchInTime).toLocaleTimeString()}</td>
                  <td>${r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : '—'}</td>
                  <td>${r.workingHours || '0.0'}h</td>
                  <td><span class="status ${r.validationStatus === 'VALID' ? 'status-valid' : ''}">${r.shiftStatus}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Confidential Attendance Report • Digital Signature Verified
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (dashboardState.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={32} /></div>;
  }

  if (dashboardState.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Dashboard Error</h3>
          <p className="text-slate-400 text-sm mb-1">Could not load dashboard data.</p>
          <p className="text-slate-500 text-xs font-mono">{dashboardState.error?.data?.message || dashboardState.error?.status || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const teamSize = isManager
    ? (stats.teamSize ?? 0)
    : (stats.users?.totalActive ?? 0);
  const todaysAttendance = stats.todaysAttendance || [];
  const presentCount = isManager ? todaysAttendance.length : (stats.attendanceToday?.totalPunchedIn || 0);
  const presentPercentage = teamSize > 0 ? Math.round((presentCount / teamSize) * 100) : 0;
  
  const recentOvertime = isManager ? (stats.pendingOvertime || []) : (stats.globalPendingOvertime || []);
  const otPendingCount = recentOvertime.filter(ot => ot.status === 'PENDING').length;

  const weeklyHoursData = stats.weeklyHours || [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyMap = Object.fromEntries(weeklyHoursData.map(d => [d._id, d.totalHours]));
  const maxHours = Math.max(...Object.values(weeklyMap), 8);
  const todayDow = new Date().getDay() + 1;

  let avgHours = 0;
  if (todaysAttendance.length > 0) {
    const total = todaysAttendance.reduce((sum, rec) => sum + (rec.workingHours || 0), 0);
    avgHours = (total / todaysAttendance.length).toFixed(1);
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      <div className="mb-8">
        <div className="text-xs font-bold text-slate-500 tracking-[0.2em] mb-1">TEAM WORKSPACE</div>
        <h2 className="text-3xl font-semibold text-white tracking-tight">Good morning, <span className="text-primary">{user.name.split(' ')[0]}</span></h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <MetricCard label="TEAM PRESENT" value={`${presentCount} / ${teamSize}`} trend={`${presentPercentage}% today`} icon={Users} colorClass={{bg: 'bg-emerald-500/20', text: 'text-emerald-400'}} trendClass="text-emerald-400" />
        <MetricCard label="AVG HOURS" value={`${avgHours}h`} trend="+0.0" icon={Clock} colorClass={{bg: 'bg-blue-500/20', text: 'text-blue-400'}} trendClass="text-blue-400" />
        <MetricCard label="OT PENDING" value={otPendingCount} trend="Needs review" icon={AlertTriangle} colorClass={{bg: 'bg-amber-500/20', text: 'text-amber-400'}} trendClass="text-amber-400" />
        <MetricCard label="SUSPICIOUS" value="0" trend="Flagged today" icon={ShieldAlert} colorClass={{bg: 'bg-purple-500/20', text: 'text-purple-400'}} trendClass="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-6">
        
        {/* Attendance Log */}
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="p-5 border-b border-dark-border flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-lg font-bold text-white">Attendance log</h3>
            <span className="text-xs font-bold text-slate-400 bg-dark-bg px-3 py-1 rounded-full border border-dark-border">{todaysAttendance.length} entries</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-bg/50 text-[0.65rem] uppercase tracking-wider text-slate-500 border-b border-dark-border">
                  <th className="p-4 font-semibold">Employee</th>
                  <th className="p-4 font-semibold">Punch In</th>
                  <th className="p-4 font-semibold">Punch Out</th>
                  <th className="p-4 font-semibold text-right">Hours</th>
                  <th className="p-4 font-semibold text-center">Location</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-center">Verification</th>
                  <th className="p-4 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {todaysAttendance.length === 0 ? (
                  <tr><td colSpan="8" className="p-8 text-center text-slate-500 text-sm">No attendance records today.</td></tr>
                ) : (
                  todaysAttendance.map(record => (
                    <tr key={record._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold">
                            {record.user?.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{record.user?.name}</div>
                            <div className="text-xs text-slate-500">{new Date(record.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-300 font-medium">
                        {new Date(record.punchInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4 text-sm text-slate-300 font-medium">
                        {record.punchOutTime ? new Date(record.punchOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                      </td>
                      <td className="p-4 text-sm font-bold text-right text-emerald-400">
                        {record.workingHours || '0.0'}h
                      </td>
                      <td className="p-4 text-center text-xs text-slate-400">
                        📍 {record.punchInLocation?.locationName || 'GPS'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${
                          record.shiftStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          record.shiftStatus === 'INCOMPLETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-primary/10 text-primary border-primary/20 animate-pulse'
                        }`}>
                          {record.shiftStatus || 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${
                          record.validationStatus === 'VALID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          record.validationStatus === 'INVALID' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {record.validationStatus === 'PENDING' ? 'Unverified' : record.validationStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6 h-fit">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-bold text-white">Weekly hours</h3>
            {weeklyHoursData.length === 0 && (
              <span className="text-[0.65rem] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full font-bold">No data yet</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-4 font-medium">Standard shift threshold · 8h per person/day</p>
          
          <div className="flex items-end justify-between h-40 border-b border-dark-border pb-2 relative">
            <div className="absolute w-full border-t border-dashed border-slate-600/70 top-[20%] z-0 pointer-events-none"></div>
            <span className="absolute top-[8%] -left-1 text-[0.6rem] text-slate-500 font-medium">8h</span>
            
            {days.map((day, i) => {
              const dow = i + 1; // MongoDB dayOfWeek: 1=Sun...7=Sat
              const hours = weeklyMap[dow] || 0;
              const MIN_VIS = 3; // percent minimum visible
              const heightPct = hours > 0
                ? Math.max(MIN_VIS, Math.round((hours / maxHours) * 100))
                : MIN_VIS;
              const isToday = dow === todayDow;
              const exceeds8h = hours >= 8;
              const hasData = hours > 0;
              return (
                <div key={day} className="flex flex-col items-center gap-1 z-10 flex-1" title={`${day}: ${hours.toFixed(1)}h`}>
                  <div className="w-8 mx-auto bg-dark-bg/80 border border-dark-border rounded-t-lg h-full flex items-end overflow-visible relative">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-700 ${
                        isToday && hasData
                          ? 'bg-primary shadow-[0_0_12px_rgba(45,212,191,0.6)]'
                          : isToday
                          ? 'bg-primary/30'
                          : exceeds8h
                          ? 'bg-emerald-500'
                          : hasData
                          ? 'bg-slate-600'
                          : 'bg-slate-800 border-t border-slate-700'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                  <span className={`text-[0.65rem] font-bold mt-1 ${isToday ? 'text-primary' : 'text-slate-500'}`}>{day}</span>
                  <span className={`text-[0.6rem] font-semibold ${hasData ? (exceeds8h ? 'text-emerald-400' : 'text-slate-400') : 'text-slate-700'}`}>
                    {hasData ? `${hours % 1 === 0 ? hours : hours.toFixed(1)}h` : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-dark-border">
            <div className="flex items-center gap-1.5 text-[0.65rem] text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-primary"></div> Today</div>
            <div className="flex items-center gap-1.5 text-[0.65rem] text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> ≥ 8h</div>
            <div className="flex items-center gap-1.5 text-[0.65rem] text-slate-500"><div className="w-2.5 h-2.5 rounded-sm bg-slate-600"></div> &lt; 8h</div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        
        <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-[#161b22] to-primary/10 border-primary/20 h-fit">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Daily attendance report</h3>
            <p className="text-sm text-slate-400">Export name, punch times, selfie, location, hours and validation status.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-dark-bg border border-dark-border rounded-xl font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download size={16} /> CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-dark-bg rounded-xl font-bold transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:shadow-[0_0_20px_rgba(45,212,191,0.5)]"
            >
              <Download size={16} /> PDF report
            </button>
          </div>
        </div>

        <div className="glass-card flex flex-col overflow-hidden h-fit">
          <div className="p-5 border-b border-dark-border flex justify-between items-center bg-white/[0.02]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-purple-400" /> Overtime requests
            </h3>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              {otPendingCount} pending
            </span>
          </div>
          
          <div className="p-2">
            {recentOvertime.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No overtime requests.</div>
            ) : (
              recentOvertime.map(ot => (
                <div key={ot._id} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-dark-border mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold border border-slate-700">
                      {ot.user?.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {ot.user?.name} 
                        <span className="text-[0.65rem] font-normal text-slate-500">{new Date(ot.createdAt).toISOString().split('T')[0]}</span>
                      </div>
                      <div className="text-xs text-slate-400 max-w-[150px] truncate">{ot.reason || 'No reason provided'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                      +{ot.requestedHours}h
                    </div>
                    
                    <div className="flex items-center justify-end w-20">
                      {ot.status === 'PENDING' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleRejectOT(ot._id)} className="p-1.5 rounded-md text-red-400 hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-500/30 bg-dark-bg" title="Reject">
                            <X size={14} />
                          </button>
                          <button onClick={() => handleApproveOT(ot._id)} className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-transparent hover:border-emerald-500/30 bg-dark-bg" title="Approve">
                            <Check size={14} />
                          </button>
                        </div>
                      )}
                      {ot.status === 'APPROVED' && <span className="inline-block px-2 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>}
                      {ot.status === 'REJECTED' && <span className="inline-block px-2 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
          <div className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-dark-border flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white">Verify Attendance</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white transition-colors"><XCircle size={20}/></button>
            </div>
            
            <div className="p-6">
              <div className="w-full aspect-video bg-dark-bg rounded-xl mb-6 overflow-hidden border border-dark-border flex items-center justify-center relative shadow-inner">
                {selectedRecord.punchInImage ? (
                  <img src={selectedRecord.punchInImage} alt="Selfie" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500 font-medium">No Image Submitted</span>
                )}
                <div className="absolute top-3 right-3 bg-dark-card/80 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-slate-300 border border-white/10 flex items-center gap-1.5 shadow-lg">
                  <ShieldAlert size={12} className="text-primary"/> Verification Required
                </div>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-xl border border-dark-border mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400 font-medium">Employee</span>
                  <span className="text-sm text-white font-bold">{selectedRecord.user?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-medium">Punch In Time</span>
                  <span className="text-sm text-white font-bold">{new Date(selectedRecord.punchInTime).toLocaleTimeString()}</span>
                </div>
              </div>
              
              <input 
                type="text" 
                placeholder="Manager remarks (optional)" 
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:bg-dark-bg/80 transition-all shadow-inner mb-6"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleValidate(selectedRecord._id, 'INVALID')}
                  className="py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  <XCircle size={18}/> Mark Invalid
                </button>
                <button 
                  onClick={() => handleValidate(selectedRecord._id, 'VALID')}
                  className="py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <CheckCircle size={18}/> Mark Valid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
