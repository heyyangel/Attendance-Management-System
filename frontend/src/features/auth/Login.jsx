import React, { useState } from 'react';
import { useLoginMutation, useSignupMutation } from '../../services/authApi';
import { Loader2, Mail, Lock, User, Briefcase } from 'lucide-react';

const Login = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', employeeId: '', department: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [signup, { isLoading: isSigningUp }] = useSignupMutation();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isLoginView) {
        await login({ email: formData.email, password: formData.password }).unwrap();
      } else {
        await signup(formData).unwrap();
        setSuccess('Account created! You can now sign in.');
        setIsLoginView(true);
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {
      setError(err?.data?.message || 'Authentication failed');
    }
  };

  const isLoading = isLoggingIn || isSigningUp;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-10 relative z-10 backdrop-blur-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLoginView ? 'Enter your credentials to access your workspace.' : 'Register as a new team member.'}
          </p>
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 font-medium">{error}</div>}
        {success && <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 font-medium">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLoginView && (
            <>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="w-full bg-dark-bg/50 border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:bg-dark-bg/80 transition-all shadow-inner" />
              </div>
              <div className="flex gap-4">
                <div className="relative group w-1/2">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input type="text" name="employeeId" placeholder="Emp ID" value={formData.employeeId} onChange={handleChange} required className="w-full bg-dark-bg/50 border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:bg-dark-bg/80 transition-all shadow-inner" />
                </div>
                <div className="relative group w-1/2">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <input type="text" name="department" placeholder="Dept" value={formData.department} onChange={handleChange} required className="w-full bg-dark-bg/50 border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:bg-dark-bg/80 transition-all shadow-inner" />
                </div>
              </div>
            </>
          )}

          <div className="relative group">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="w-full bg-dark-bg/50 border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:bg-dark-bg/80 transition-all shadow-inner" />
          </div>
          
          <div className="relative group">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full bg-dark-bg/50 border border-dark-border rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:bg-dark-bg/80 transition-all shadow-inner" />
          </div>

          <button type="submit" disabled={isLoading} className="mt-2 w-full bg-primary hover:bg-primary-hover text-dark-bg font-bold py-3.5 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(45,212,191,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : isLoginView ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setSuccess(''); }} className="text-primary font-semibold hover:text-white transition-colors">
            {isLoginView ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
