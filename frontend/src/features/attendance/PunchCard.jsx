import React, { useRef, useState, useEffect } from 'react';
import { useGetTodayStatusQuery, usePunchInMutation, usePunchOutMutation } from '../../services/attendanceApi';
import { MapPin, Camera, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const PunchCard = () => {
  const { data: statusResponse, isLoading: isStatusLoading, error: authError } = useGetTodayStatusQuery();
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
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }
      
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
        (err) => setError("Please allow location access to punch in/out.")
      );

      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(mediaStream);
      setIsCameraReady(true);
    } catch (err) {
      setError("Camera/Location access denied. Please allow permissions in your browser.");
    }
  };

  useEffect(() => {
    if (isCameraReady && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraReady, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handlePunch = async (type) => {
    if (!location) {
      setError("Waiting for GPS location...");
      return;
    }
    const imageBase64 = captureImage();
    if (!imageBase64) {
      setError("Failed to capture selfie.");
      return;
    }

    const payload = {
      latitude: location.latitude,
      longitude: location.longitude,
      image: imageBase64
    };

    try {
      if (type === 'IN') {
        await punchIn(payload).unwrap();
      } else {
        await punchOut(payload).unwrap();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setIsCameraReady(false);
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to punch. Please try again.");
    }
  };

  if (authError && authError.status === 401) {
     return (
        <div className="flex justify-center items-center p-10">
          <div className="glass-card p-10 text-center max-w-md w-full">
             <AlertCircle size={48} className="text-amber-500 mx-auto mb-4"/>
             <h3 className="text-xl font-bold text-white mb-2">Authentication Required</h3>
             <p className="text-slate-400 text-sm">
               Please implement the Login page and sign in to use the Punch Card.
             </p>
          </div>
        </div>
     )
  }

  const todayStatus = statusResponse?.data;
  const isCheckedIn = !!todayStatus;
  const isCheckedOut = !!todayStatus?.punchOutTime;
  
  const isProcessing = isPunchingIn || isPunchingOut;

  if (isStatusLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
         <div className="flex items-center gap-2 text-primary font-bold"><Loader2 className="animate-spin" size={24} /> Loading Systems...</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-10 px-4">
      <div className="glass-card max-w-[450px] w-full p-8 relative overflow-hidden bg-gradient-to-b from-[#111827] to-[#064e3b]">
        
        <div className="text-center mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Daily Attendance</h2>
          <div className="text-5xl font-bold text-primary mb-2 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)] tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <p className="text-sm text-slate-300 font-medium">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-300 p-4 rounded-xl text-sm mb-6 border border-red-500/30 flex items-center gap-3 font-medium">
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isCheckedOut ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <CheckCircle2 size={64} className="text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-emerald-400 mb-2">Shift Completed</h3>
            <p className="text-slate-300 text-sm">You worked {todayStatus.workingHours} hours today.</p>
          </div>
        ) : (
          <>
            <div className={`w-full aspect-square max-h-[350px] rounded-2xl mb-8 overflow-hidden relative border-2 ${isCameraReady ? 'border-primary shadow-[0_0_20px_rgba(45,212,191,0.2)]' : 'border-slate-700 border-dashed bg-slate-900/50'}`}>
              {!isCameraReady ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-primary hover:bg-slate-800/50 transition-all" onClick={startSystems}>
                  <Camera size={48} className="mb-4" />
                  <p className="text-sm font-medium text-center">Tap to Activate<br/>Camera & GPS</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  {location && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-dark-card/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-slate-300 border border-white/10 flex items-center gap-2 shadow-lg">
                      <MapPin size={14} className="text-primary"/> {locationName || 'Detecting...'}
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              {!isCheckedIn ? (
                <button 
                  className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all duration-300 ${!isCameraReady || isProcessing ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(45,212,191,0.5)] text-dark-bg'}`}
                  onClick={() => handlePunch('IN')}
                  disabled={!isCameraReady || isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={24} /> : 'PUNCH IN'}
                </button>
              ) : (
                <button 
                  className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all duration-300 ${!isCameraReady || isProcessing ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(245,158,11,0.5)] text-dark-bg'}`}
                  onClick={() => handlePunch('OUT')}
                  disabled={!isCameraReady || isProcessing}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={24} /> : 'PUNCH OUT'}
                </button>
              )}
            </div>
            
            {isCheckedIn && (
              <p className="mt-6 text-sm text-slate-400 font-medium flex items-center justify-center gap-2">
                <Clock size={16} /> Punched in at {new Date(todayStatus.punchInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default PunchCard;
