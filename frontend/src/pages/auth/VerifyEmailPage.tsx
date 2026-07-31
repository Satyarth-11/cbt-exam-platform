import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState<string>(tokenFromUrl);
  const [loading, setLoading] = useState<boolean>(!!tokenFromUrl);
  const [success, setSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const verifyToken = async (tokenValue: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res: any = await axiosClient.post('/auth/verify-email', { token: tokenValue.trim() });
      setSuccess(true);
      setMessage(res.message || 'Email address successfully verified!');
    } catch (err: any) {
      setSuccess(false);
      setErrorMsg(err?.message || 'Failed to verify email address. Code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim().length === 6) {
      verifyToken(token.trim());
    } else {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 px-6 flex-1 flex flex-col justify-center">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-center">
        {loading ? (
          <div className="space-y-4 py-8 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            <h2 className="text-xl font-bold text-white">Verifying Candidate Email...</h2>
            <p className="text-xs text-slate-400">Validating OTP code against the testing engine</p>
          </div>
        ) : success ? (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Email Verified!</h2>
              <p className="text-xs text-slate-300 mt-2">{message}</p>
            </div>
            <Link
              to="/login"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              Sign In to Your Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-left">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto text-cyan-400 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Verify Your Account</h2>
              <p className="text-xs text-slate-400 mt-2">
                Enter the 6-digit verification code/OTP sent to your email.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Verification OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-center tracking-widest font-mono text-xl focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || token.trim().length !== 6}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 shadow-md transition-all disabled:opacity-50"
              >
                Verify Email Address
              </button>
            </form>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-block text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
