import React, { useState } from 'react';
import { useGetMyAttendanceQuery } from '../../services/attendanceApi';
import { useRequestOvertimeMutation } from '../../services/overtimeApi';
import { Clock, PlusCircle, Loader2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

const AttendanceHistory = () => {
  const { data: attendanceData, isLoading } = useGetMyAttendanceQuery();
  const [requestOvertime, { isLoading: isRequesting }] = useRequestOvertimeMutation();

  const [selectedShift, setSelectedShift] = useState(null);
  const [otHours, setOtHours] = useState('');
  const [otReason, setOtReason] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const records = attendanceData?.data || [];

  const handleOvertimeSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      await requestOvertime({
        attendanceId: selectedShift._id,
        requestedHours: parseFloat(otHours),
        reason: otReason
      }).unwrap();
      setMsg({ text: 'Overtime requested successfully!', type: 'success' });
      setSelectedShift(null);
      setOtHours('');
      setOtReason('');
    } catch (err) {
      setMsg({ text: err?.data?.message || 'Failed to request overtime', type: 'error' });
    }
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-dark-border">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
              <Calendar className="text-primary" size={24} /> Shift History
            </h2>
            <p className="text-slate-400 text-sm">Review your past punches and request overtime.</p>
          </div>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 mb-6 font-medium ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {msg.text}
          </div>
        )}

        <div className="space-y-4">
          {records.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">No attendance records found.</div>
          ) : (
            records.map(record => (
              <div key={record._id} className="bg-dark-bg/50 border border-dark-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary">
                    <span className="text-xs font-bold uppercase">{new Date(record.date).toLocaleDateString([], { month: 'short' })}</span>
                    <span className="text-xl font-bold leading-none">{new Date(record.date).getDate()}</span>
                  </div>
                  
                  <div>
                    <div className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                      {new Date(record.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                      <span className="text-slate-500 text-sm">→</span> 
                      {record.punchOutTime ? new Date(record.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-slate-500 text-sm font-normal">Active</span>}
                    </div>
                    
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${
                      record.shiftStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      record.shiftStatus === 'INCOMPLETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-primary/10 text-primary border-primary/20 animate-pulse'
                    }`}>
                      {record.shiftStatus || 'Active'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-dark-border pt-4 md:pt-0 md:pl-6">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Hours</div>
                    <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5"><Clock size={16}/> {record.workingHours || 0}</div>
                  </div>
                  
                  {record.shiftStatus !== 'PENDING' && (
                    <button 
                      className="ml-4 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                      onClick={() => setSelectedShift(record)}
                    >
                      <PlusCircle size={16} /> Request OT
                    </button>
                  )}
                </div>
                
              </div>
            ))
          )}
        </div>

        {/* Overtime Request Modal */}
        {selectedShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedShift(null)}>
            <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-dark-border">
                <h3 className="text-xl font-bold text-white">Request Overtime</h3>
                <p className="text-sm text-slate-400 mt-1">For shift on {new Date(selectedShift.date).toLocaleDateString()}</p>
              </div>
              
              <form onSubmit={handleOvertimeSubmit} className="p-6 flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Requested Hours</label>
                  <input 
                    type="number" 
                    step="0.5"
                    placeholder="e.g. 2.5" 
                    value={otHours}
                    onChange={(e) => setOtHours(e.target.value)}
                    required 
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-dark-bg/80 transition-all shadow-inner"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason</label>
                  <textarea 
                    placeholder="Why did you stay late?"
                    value={otReason}
                    onChange={(e) => setOtReason(e.target.value)}
                    required
                    rows="3"
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-dark-bg/80 transition-all shadow-inner resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-dark-bg border border-dark-border hover:bg-slate-800 transition-colors" onClick={() => setSelectedShift(null)}>Cancel</button>
                  <button type="submit" disabled={isRequesting} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 transition-colors flex justify-center items-center">
                    {isRequesting ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AttendanceHistory;
