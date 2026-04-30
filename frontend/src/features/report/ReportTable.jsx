import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetAttendanceReportQuery, useValidateAttendanceMutation } from '../../services/attendanceApi';
import { Loader2, Search, FileText, ChevronLeft, ChevronRight, Download, Check, X } from 'lucide-react';

// Inline editable dropdown for status cells
const StatusDropdown = ({ recordId, field, currentValue, options, colorMap, onSave, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue);
  const [saving, setSaving] = useState(false);

  if (!isAdmin) {
    const colors = colorMap[currentValue] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${colors}`}>
        {currentValue || 'N/A'}
      </span>
    );
  }

  const handleSave = async () => {
    if (value === currentValue) { setIsEditing(false); return; }
    setSaving(true);
    await onSave(recordId, field, value);
    setSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(currentValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <select
          value={value}
          onChange={e => setValue(e.target.value)}
          className="bg-dark-bg border border-primary/50 rounded-lg py-1 px-2 text-white text-xs focus:outline-none"
          autoFocus
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button onClick={handleSave} disabled={saving} className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 transition-colors">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button onClick={handleCancel} className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
          <X size={12} />
        </button>
      </div>
    );
  }

  const colors = colorMap[value] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  return (
    <span
      onClick={() => setIsEditing(true)}
      title="Click to edit"
      className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 hover:ring-1 hover:ring-primary/40 transition-all ${colors}`}
    >
      {value || 'N/A'}
    </span>
  );
};

const ReportTable = () => {
  const user = useSelector(state => state.auth.user);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [toast, setToast] = useState(null);

  const { data, isLoading, isFetching } = useGetAttendanceReportQuery({
    page, limit: 10,
    startDate: filters.startDate,
    endDate: filters.endDate
  });
  const [validateAttendance] = useValidateAttendanceMutation();

  const response = data?.data;
  const records = response?.records || [];
  const pagination = response?.pagination || {};

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusSave = async (id, field, value) => {
    try {
      const payload = field === 'shiftStatus' ? { shiftStatus: value } : { validationStatus: value };
      await validateAttendance({ id, ...payload }).unwrap();
      showToast(`${field === 'shiftStatus' ? 'Shift' : 'Validation'} status updated to "${value}"`, 'success');
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!records.length) return showToast("No records to export", "error");
    const headers = ["Employee", "ID", "Date", "Punch In", "Punch Out", "Hours", "Shift Status", "Validation"];
    const rows = records.map(r => [
      r.user?.name,
      r.user?.employeeId,
      new Date(r.date).toLocaleDateString(),
      new Date(r.punchInTime).toLocaleTimeString(),
      r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : '—',
      r.workingHours || 0,
      r.shiftStatus,
      r.validationStatus
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Report_Page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyFilters = () => { setPage(1); setFilters({ startDate, endDate }); };
  const handleClearFilters = () => {
    setStartDate(''); setEndDate(''); setPage(1);
    setFilters({ startDate: '', endDate: '' });
  };

  const shiftColorMap = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    INCOMPLETE: 'bg-red-500/10 text-red-400 border-red-500/20',
    ACTIVE: 'bg-primary/10 text-primary border-primary/20',
  };
  const validationColorMap = {
    VALID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    INVALID: 'bg-red-500/10 text-red-400 border-red-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 border transition-all ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />} {toast.msg}
        </div>
      )}

      <div className="glass-card flex flex-col overflow-hidden">
        {/* Header & Export */}
        <div className="p-6 border-b border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
              <FileText className="text-emerald-400" size={24} /> Attendance Reports
            </h2>
            <p className="text-slate-400 text-sm">
              View, filter, and export attendance records.
              {isAdmin && <span className="ml-2 text-primary font-semibold">Click any status badge to edit inline.</span>}
            </p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="p-5 border-b border-dark-border bg-dark-bg/50 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-xl py-2 px-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleApplyFilters}
              className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-dark-bg rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
              <Search size={16} /> Apply
            </button>
            <button onClick={handleClearFilters}
              className="flex-1 md:flex-none px-6 py-2.5 bg-dark-bg border border-dark-border rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors flex justify-center items-center">
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-card/50 backdrop-blur-sm z-10">
              <Loader2 className="animate-spin text-emerald-400 mb-2" size={32} />
              <span className="text-slate-400 font-medium">Loading reports...</span>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-bg/80 text-[0.65rem] uppercase tracking-wider text-slate-500 border-b border-dark-border">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Punch In</th>
                <th className="p-4 font-semibold">Punch Out</th>
                <th className="p-4 font-semibold text-right">Hours</th>
                <th className="p-4 font-semibold text-center">
                  Shift Status {isAdmin && <span className="text-primary normal-case tracking-normal">✎</span>}
                </th>
                <th className="p-4 font-semibold text-center">
                  Validation {isAdmin && <span className="text-primary normal-case tracking-normal">✎</span>}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-500 font-medium">No records found for the selected criteria.</td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-sm">
                          {record.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{record.user?.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{record.user?.employeeId || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-300 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-slate-300 font-medium">
                      {new Date(record.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-sm text-slate-300 font-medium">
                      {record.punchOutTime ? new Date(record.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-4 text-sm font-bold text-emerald-400 text-right">{record.workingHours || '0.0'}h</td>
                    <td className="p-4 text-center">
                      <StatusDropdown
                        recordId={record._id}
                        field="shiftStatus"
                        currentValue={record.shiftStatus || 'ACTIVE'}
                        options={['ACTIVE', 'COMPLETED', 'INCOMPLETE']}
                        colorMap={shiftColorMap}
                        onSave={handleStatusSave}
                        isAdmin={isAdmin}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <StatusDropdown
                        recordId={record._id}
                        field="validationStatus"
                        currentValue={record.validationStatus || 'PENDING'}
                        options={['PENDING', 'VALID', 'INVALID']}
                        colorMap={validationColorMap}
                        onSave={handleStatusSave}
                        isAdmin={isAdmin}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-dark-border bg-white/[0.02] flex items-center justify-between">
            <span className="text-sm text-slate-400 font-medium">
              Page <span className="text-white font-bold">{pagination.currentPage}</span> of <span className="text-white font-bold">{pagination.totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrevPage} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                <ChevronLeft size={16} /> Prev
              </button>
              <button disabled={!pagination.hasNextPage} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTable;
