import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import PaySphereLogo from '../components/PaySphereLogo';

export const LoginPage = ({ onLoginSuccess }) => {
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Form validation & live backend authentication
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username or email is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // First attempt relative URL (proxied via Vite dev server), fallback to direct 8000
      let response;
      try {
        response = await fetch('/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        });
      } catch (proxyErr) {
        // Fallback to direct Django backend URL if proxy isn't active
        response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password,
          }),
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response || response.status >= 500) {
        setIsLoading(false);
        setErrors({
          general: 'Cannot connect to Django backend on port 8000. Please make sure the backend server is running (`python backend/manage.py runserver 8000`).',
        });
        return;
      }

      if (response.ok && data.token) {
        // Save auth state
        localStorage.setItem('paysphere_token', data.token);
        localStorage.setItem('paysphere_user', JSON.stringify(data.user));

        setIsLoading(false);
        setLoginSuccess(true);

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
        }, 600);
      } else {
        setIsLoading(false);
        // Authentication failed - user does not exist or credentials incorrect
        let errorMsg = 'Invalid credentials. User does not exist or password is incorrect.';
        if (data.non_field_errors && data.non_field_errors.length > 0) {
          errorMsg = data.non_field_errors[0];
        } else if (data.detail) {
          errorMsg = data.detail;
        }
        setErrors({ general: errorMsg });
      }
    } catch (err) {
      setIsLoading(false);
      setErrors({
        general:
          'Unable to reach backend server. Please ensure Django is running: `python backend/manage.py runserver 8000`',
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white selection:bg-indigo-500/20 selection:text-indigo-900 font-sans">
      {/* ----------------- LEFT HERO BRANDING SECTION ----------------- */}
      <div className="relative w-full lg:w-1/2 min-h-[380px] lg:min-h-screen bg-[#11133c] text-white flex flex-col justify-between p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24 overflow-hidden">
        {/* Ambient background glow in top-left */}
        <div 
          className="absolute -top-24 -left-24 w-96 h-96 lg:w-[540px] lg:h-[540px] rounded-full pointer-events-none opacity-60 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(67, 56, 202, 0.25) 45%, rgba(17, 19, 60, 0) 75%)'
          }}
        />
        
        {/* Subtle decorative bottom glow */}
        <div 
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full pointer-events-none opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(79, 70, 229, 0.4) 0%, rgba(17, 19, 60, 0) 70%)'
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PaySphereLogo size="sm" />
            <span className="text-xs uppercase tracking-widest text-indigo-200/60 font-medium">Boparai Industries</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-indigo-200 backdrop-blur-sm border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Online
          </span>
        </div>

        {/* Centered Brand Content */}
        <div className="relative z-10 my-auto py-12 lg:py-0 max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-white leading-tight">
              PaySphere
            </h1>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-medium text-white/95 mt-2 tracking-normal leading-snug">
            Employee &amp; Payroll Management System
          </h2>

          <p className="text-slate-300/85 text-base sm:text-lg leading-relaxed mt-6 max-w-lg font-normal">
            Manage employees, streamline payroll, track attendance, and generate salary reports — all in one secure and easy-to-use platform.
          </p>

          <div className="mt-10 flex flex-wrap gap-2.5 pt-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-indigo-100">
              <ShieldCheck className="w-4 h-4 text-indigo-300" />
              <span>Enterprise Grade Security</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-indigo-100">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Automated Payroll Engine</span>
            </div>
          </div>
        </div>

        {/* Left Bottom Tagline */}
        <div className="relative z-10 text-xs text-indigo-200/50 hidden lg:block">
          Trusted portal infrastructure for modern workforce management.
        </div>
      </div>

      {/* ----------------- RIGHT AUTH SECTION ----------------- */}
      <div className="w-full lg:w-1/2 min-h-[600px] lg:min-h-screen bg-white flex flex-col justify-between p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24 relative">
        <div className="h-4" />

        {/* Center Container: Clean Admin Sign In */}
        <div className="my-auto w-full max-w-md mx-auto py-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </div>
            <h2 className="text-3xl font-bold text-[#111827] tracking-tight">
              Sign In
            </h2>
            <p className="text-[#64748b] text-sm mt-1.5">
              Enter your administrative credentials to access PaySphere.
            </p>
          </div>

          {/* General Error Banner */}
          {errors.general && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Authentication Failed</p>
                <p className="text-rose-700 mt-0.5">{errors.general}</p>
              </div>
            </div>
          )}

          {loginSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-emerald-900">Authentication Successful</h3>
              <p className="text-xs text-emerald-700 mt-1">Redirecting to Dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username || errors.general) {
                        setErrors({ ...errors, username: null, general: null });
                      }
                    }}
                    placeholder="ashmeet123"
                    autoComplete="username"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                      errors.username
                        ? 'border-rose-400 focus:ring-rose-400/20'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password || errors.general) {
                        setErrors({ ...errors, password: null, general: null });
                      }
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border rounded-xl text-sm transition-all text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                      errors.password
                        ? 'border-rose-400 focus:ring-rose-400/20'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer bg-[#11133c] hover:bg-[#1a1e5a] shadow-indigo-900/10 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2026 Boparai Industries. All rights reserved.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your work email and instructions will be sent to your inbox.
            </p>

            {forgotSubmitted ? (
              <div className="my-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Password reset link sent to <strong>{forgotEmail}</strong>.</span>
              </div>
            ) : (
              <div className="mt-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordOpen(false);
                  setForgotSubmitted(false);
                  setForgotEmail('');
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              {!forgotSubmitted && (
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail.trim()) {
                      setForgotSubmitted(true);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#11133c] hover:bg-[#1a1e5a] text-white transition cursor-pointer"
                >
                  Send Reset Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
