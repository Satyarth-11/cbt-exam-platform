import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage('No verification token provided in URL.');
      return;
    }

    axiosClient.post('/auth/verify-email', { token })
      .then((res: any) => {
        setSuccess(true);
        setMessage(res.message || 'Email address successfully verified!');
      })
      .catch((err: any) => {
        setSuccess(false);
        setMessage(err?.message || 'Failed to verify email address. Token may be invalid or expired.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto my-16 px-6 flex-1 flex flex-col justify-center">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-center">
        {loading ? (
          <div className="space-y-4 py-8 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
            <h2 className="text-xl font-bold text-white">Verifying Candidate Email...</h2>
            <p className="text-xs text-slate-400">Validating SHA-256 token against the testing engine</p>
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
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Verification Failed</h2>
              <p className="text-xs text-slate-400 mt-2">{message}</p>
            </div>
            <Link
              to="/login"
              className="inline-block text-xs font-semibold text-cyan-400 hover:underline"
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
