import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetEmployeeDashboardQuery } from '../../services/dashboardApi';
import { useGetTodayStatusQuery, usePunchInMutation, usePunchOutMutation } from '../../services/attendanceApi';
import { Clock, MapPin, Camera, AlertCircle, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';

const PunchBox = () => {
  const { data: statusResponse, isLoading: isStatusLoading } = useGetTodayStatusQuery();
  const [punchIn, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: isPunchingOut }] = usePunchOutMutation();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startSystems = async () => {
    setError('');
    try {
      if (!navigator.geolocation) throw new Error("Geolocation not supported");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation({ latitude: lat, longitude: lon });
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            const addr = data.address;
            const place = addr.city || addr.town || addr.village || addr.suburb || addr.county || 'Remote Location';
            setLocationName(place);
          } catch (e) {
            setLocationName('GPS Location');
          }
        },
        () => setError("Allow location access")
      );
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(mediaStream);
      setIsCameraReady(true);
    } catch (err) {
      setError("Camera/Location denied.");
    }
  };

  useEffect(() => {
    if (isCameraReady && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraReady, stream]);

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [stream]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handlePunch = async (type) => {
    if (!location) return setError("Waiting for GPS...");
    const imageBase64 = captureImage();
    if (!imageBase64) return setError("Failed to capture selfie.");

    const payload = { 
      latitude: location.latitude, 
      longitude: location.longitude, 
      locationName: locationName, 
      image: imageBase64 
    };
    try {
      if (type === 'IN') await punchIn(payload).unwrap();
      else await punchOut(payload).unwrap();
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setIsCameraReady(false);
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to punch.");
    }
  };

  const todayStatus = statusResponse?.data;
  const isCheckedIn = !!todayStatus;
  const isCheckedOut = !!todayStatus?.punchOutTime;
  const isProcessing = isPunchingIn || isPunchingOut;

  return (
    <div className="bg-gradient-to-b from-[#111827] to-[#064e3b] border border-gray-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-2xl">
      <div className="text-xs text-gray-400 tracking-widest mb-2 font-semibold">CURRENT SHIFT</div>
      <div className="text-5xl font-bold leading-none mb-1 text-primary drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-sm text-gray-300 mb-6 font-medium">
        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl text-sm mb-4 border border-red-500/30 flex items-center gap-2 font-medium"><AlertCircle size={16}/> {error}</div>}

      {isCheckedOut ? (
        <div className="bg-emerald-500/20 text-emerald-200 p-5 rounded-xl text-center font-bold mb-5 border border-emerald-500/30">
          Shift Completed ({todayStatus.workingHours}h)
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-5">
            <div 
              className={`flex-1 h-20 bg-slate-900/40 border ${isCameraReady ? 'border-primary/50' : 'border-white/10'} rounded-xl flex justify-center items-center cursor-pointer overflow-hidden transition-all hover:bg-slate-900/60`} 
              onClick={!isCameraReady ? startSystems : undefined}
            >
              {!isCameraReady ? (
                <div className="flex flex-col items-center gap-1.5 text-gray-300 text-xs font-medium">
                  <Camera size={20} className="text-primary" />
                  <span>Tap to capture</span>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              )}
            </div>
            <div className="flex-[1.2] h-20 bg-slate-900/40 border border-primary/50 rounded-xl p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-[0.65rem] text-gray-400 mb-1 font-semibold uppercase tracking-wider">
                <MapPin size={12} className="text-primary"/> LOCATION <div className="w-1.5 h-1.5 bg-primary rounded-full ml-auto animate-pulse"></div>
              </div>
              <div className="text-sm font-bold text-white mb-0.5">{location ? locationName || 'Detecting...' : 'Waiting...'}</div>
              <div className="text-[0.65rem] text-gray-500">{location ? `${location.latitude.toFixed(4)}°N, ${location.longitude.toFixed(4)}°E` : '--'}</div>
            </div>
          </div>

          <button 
            className={`w-full p-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all duration-300 ${!isCameraReady ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(45,212,191,0.5)] text-dark-bg'}`}
            onClick={() => handlePunch(isCheckedIn ? 'OUT' : 'IN')}
            disabled={!isCameraReady || isProcessing}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <ArrowRight size={20} />}
            {isCheckedIn ? 'Punch Out' : 'Punch In'}
          </button>
        </>
      )}
      <div className="mt-5 text-xs text-gray-400 flex items-center gap-1.5 font-medium">
        <Clock size={14}/> Standard shift: 8 hours · Overtime requires approval
      </div>
    </div>
  );
};

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

const EmployeeDashboard = () => {
  const user = useSelector(state => state.auth.user);
  const { data, isLoading } = useGetEmployeeDashboardQuery();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={32} /></div>;

  const stats = data?.data?.stats || { totalHours: 0, daysPresent: 0 };
  const recentAttendance = data?.data?.recentAttendance || [];
  const recentOvertime = data?.data?.recentOvertime || [];

  const avgDaily = stats.daysPresent > 0 ? (stats.totalHours / stats.daysPresent).toFixed(1) : '0.0';
  
  const otTotal = recentOvertime.reduce((sum, ot) => sum + ot.requestedHours, 0).toFixed(1);
  const otPendingCount = recentOvertime.filter(ot => ot.status === 'PENDING').length;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <MetricCard label="THIS WEEK" value={`${stats.totalHours.toFixed(1)}h`} trend="+0.0 vs last" icon={Clock} colorClass={{bg: 'bg-emerald-500/20', text: 'text-emerald-400'}} trendClass="text-emerald-400" />
        <MetricCard label="AVG DAILY" value={`${avgDaily}h`} trend="On track" icon={Clock} colorClass={{bg: 'bg-blue-500/20', text: 'text-blue-400'}} trendClass="text-emerald-400" />
        <MetricCard label="OVERTIME" value={`${otTotal}h`} trend={`${otPendingCount} pending`} icon={Clock} colorClass={{bg: 'bg-purple-500/20', text: 'text-purple-400'}} trendClass="text-purple-400" />
        <MetricCard label="VERIFIED" value="100%" trend="All valid" icon={ShieldAlert} colorClass={{bg: 'bg-primary/20', text: 'text-primary'}} trendClass="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <PunchBox />
          
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-1">Weekly hours</h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Standard shift threshold · 8h</p>
            
            <div className="flex items-end justify-between h-40 mt-4 border-b border-dark-border pb-2 relative">
              {/* 8h threshold line */}
              <div className="absolute w-full border-t border-dashed border-slate-600 top-[20%] z-0"></div>
              <span className="absolute top-[10%] -left-1 text-[0.6rem] text-slate-500">8h</span>
              
              {/* Dummy bars for aesthetic */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const heights = ['40%', '60%', '80%', '100%', '30%', '0%', '0%'];
                const isToday = i === 3;
                return (
                  <div key={day} className="flex flex-col items-center gap-2 z-10 w-full">
                    <div className="w-8 bg-dark-bg border border-dark-border rounded-t-md h-full flex items-end overflow-hidden">
                      <div className={`w-full rounded-t-sm transition-all duration-1000 ${isToday ? 'bg-primary shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-slate-700'}`} style={{height: heights[i]}}></div>
                    </div>
                    <span className={`text-[0.65rem] font-bold ${isToday ? 'text-primary' : 'text-slate-500'}`}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* Attendance Log */}
          <div className="glass-card flex flex-col overflow-hidden">
            <div className="p-5 border-b border-dark-border flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white">Attendance log</h3>
              <span className="text-xs font-bold text-slate-400 bg-dark-bg px-3 py-1 rounded-full border border-dark-border">{recentAttendance.length} entries</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-bg/50 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-semibold">Employee</th>
                    <th className="p-4 font-semibold">Punch In</th>
                    <th className="p-4 font-semibold">Punch Out</th>
                    <th className="p-4 font-semibold text-right">Hours</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {recentAttendance.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 text-sm">No attendance records found.</td></tr>
                  ) : (
                    recentAttendance.map(record => (
                      <tr key={record._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-inner">
                              {user?.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user?.name}</div>
                              <div className="text-xs text-slate-500">{new Date(record.date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center text-xs text-slate-400">
                          📍 {record.punchInLocation?.locationName || 'GPS Location'}
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
                        <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border ${
                            record.shiftStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            record.shiftStatus === 'INCOMPLETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-primary/10 text-primary border-primary/20 animate-pulse'
                          }`}>
                            {record.shiftStatus || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overtime Requests */}
          <div className="glass-card flex flex-col overflow-hidden">
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
                        {user?.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {user?.name} 
                          <span className="text-[0.65rem] font-normal text-slate-500">{new Date(ot.createdAt).toISOString().split('T')[0]}</span>
                        </div>
                        <div className="text-xs text-slate-400 max-w-[200px] truncate">{ot.reason || 'No reason provided'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                        +{ot.requestedHours}h
                      </div>
                      <div className="w-24 text-right">
                        {ot.status === 'PENDING' && <span className="inline-block px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>}
                        {ot.status === 'APPROVED' && <span className="inline-block px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>}
                        {ot.status === 'REJECTED' && <span className="inline-block px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
