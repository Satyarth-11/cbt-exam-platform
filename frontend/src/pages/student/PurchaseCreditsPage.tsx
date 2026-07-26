import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Coins, CheckCircle2, ShieldAlert, Send, Clock, QrCode, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';

interface PaymentRequest {
  id: string;
  creditsClaimed: number;
  amountClaimedInr: number;
  orderReference: string;
  utrReference: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  createdAt: string;
}

export const PurchaseCreditsPage: React.FC = () => {
  const [selectedBundle, setSelectedBundle] = useState<'STARTER' | 'POPULAR' | 'BEST_VALUE'>('POPULAR');
  const [utrReference, setUtrReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [hasUnlimited, setHasUnlimited] = useState<boolean>(false);
  const [myRequests, setMyRequests] = useState<PaymentRequest[]>([]);
  const [submittedClaim, setSubmittedClaim] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceAndRequests = async () => {
    setLoading(true);
    try {
      const balanceRes: any = await axiosClient.get('/student/credits/balance');
      const data = balanceRes.data ?? balanceRes;
      setCreditBalance(data.paperCredits || 0);
      setHasUnlimited(data.hasUnlimitedAccess || false);

      const requestsRes: any = await axiosClient.get('/student/credits/my-requests');
      setMyRequests(requestsRes.data ?? requestsRes ?? []);
    } catch (err: any) {
      console.error('Failed to load credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceAndRequests();
  }, []);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res: any = await axiosClient.post('/student/credits/purchase-request', {
        bundleKey: selectedBundle,
        utrReference: null,
      });
      const claimData = res.data ?? res;
      setSubmittedClaim(claimData);
      fetchBalanceAndRequests();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err?.message || err?.details?.[0] || 'Failed to submit payment claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const bundleDetails = {
    STARTER: { title: 'Starter Pack', credits: 2, price: 40, badge: 'Standard' },
    POPULAR: { title: 'Most Popular', credits: 5, price: 80, badge: 'Best Seller' },
    BEST_VALUE: { title: 'Pro Candidate', credits: 10, price: 100, badge: '40% OFF' },
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5" />
            Paper Credit Store & VIP Pass
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Unlock Full Previous Year Exam Papers
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Redeem credits to unlock authentic PYPs with step-by-step solutions. 1 Credit unlocks 1 paper permanently for lifetime access.
          </p>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center min-w-[200px] shrink-0">
          <div className="text-xs text-slate-400 font-medium">Your Active Access</div>
          {hasUnlimited ? (
            <div className="text-xl font-extrabold text-amber-400 mt-1 flex items-center justify-center gap-1.5">
              ⭐ UNLIMITED VIP PASS
            </div>
          ) : (
            <div className="text-3xl font-black text-cyan-400 mt-1 flex items-center justify-center gap-2">
              <Coins className="w-7 h-7 text-cyan-400" />
              {creditBalance} <span className="text-sm font-normal text-slate-400">Credits</span>
            </div>
          )}
        </div>
      </div>

      {/* Credit Bundle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['STARTER', 'POPULAR', 'BEST_VALUE'] as const).map((key) => {
          const bundle = bundleDetails[key];
          const isSelected = selectedBundle === key;
          return (
            <div
              key={key}
              onClick={() => setSelectedBundle(key)}
              className={`cursor-pointer glass-panel p-6 rounded-3xl border transition-all relative flex flex-col justify-between space-y-6 ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/20 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
              }`}
            >
              {bundle.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {bundle.badge}
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-white">{bundle.title}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">₹{bundle.price}</span>
                  <span className="text-xs text-slate-400">INR</span>
                </div>
                <div className="mt-3 text-sm font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4" />
                  {bundle.credits} Paper Credits ({Math.round(bundle.price / bundle.credits)} ₹/paper)
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Permanent Lifetime Paper Unlock
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Step-by-step Solution Explanations
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  PDF Download & CBT Mock Test Mode
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment & Claim Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Box: UPI QR Code & Instructions */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Step 1: Scan & Pay via UPI</h2>
              <p className="text-xs text-slate-400">Pay exact bundle amount to our official UPI QR Code</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
              <img
                src="/upi-qr.png"
                onError={(e: any) => {
                  if (!e.target.dataset.triedJpg) {
                    e.target.dataset.triedJpg = 'true';
                    e.target.src = '/upi-qr.jpg';
                  } else if (!e.target.dataset.triedJpeg) {
                    e.target.dataset.triedJpeg = 'true';
                    e.target.src = '/upi-qr.jpeg';
                  }
                }}
                alt="UPI Payment QR Code"
                className="w-40 h-40 object-contain"
              />
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="font-semibold text-white text-sm">Selected Bundle:</div>
              <div className="text-cyan-400 font-bold text-base">
                {bundleDetails[selectedBundle].title} — ₹{bundleDetails[selectedBundle].price} INR
              </div>
              <p className="text-slate-400 leading-relaxed">
                Scan using GPay, PhonePe, Paytm, or any UPI app. Make sure to copy your Order Reference code into the UPI note.
              </p>
              <a
                href="https://t.me/omnitest_support"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold hover:underline pt-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Admin Support on Telegram
              </a>
            </div>
          </div>
        </div>

        {/* Right Box: Claim Submission Form */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Step 2: Submit Payment Claim</h2>
            <p className="text-xs text-slate-400">Submit your claim to generate your Order Reference code</p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {submittedClaim ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Payment Claim Submitted Successfully!
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Your Order Reference Code (Use in UPI Payment Note):</div>
                <div className="text-2xl font-black tracking-widest text-cyan-400 font-mono">
                  {submittedClaim.orderReference}
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Admins have been notified via Telegram. Your paper credits will be added to your account upon review!
              </p>
              <button
                onClick={() => setSubmittedClaim(null)}
                className="text-xs text-cyan-400 font-semibold hover:underline"
              >
                Submit another payment claim
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Credit Bundle</label>
                <select
                  value={selectedBundle}
                  onChange={(e: any) => setSelectedBundle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 text-xs font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="STARTER">Starter Pack (2 Credits - ₹40 INR)</option>
                  <option value="POPULAR">Most Popular (5 Credits - ₹80 INR)</option>
                  <option value="BEST_VALUE">Pro Candidate (10 Credits - ₹100 INR)</option>
                </select>
              </div>

              {/* Bundle selection dropdown */}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Submitting Claim...' : 'Submit Claim & Get Order Ref'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Payment Requests History Table */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Your Payment Claim History
        </h3>

        {myRequests.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No payment claims submitted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 px-4">Order Ref</th>
                  <th className="pb-3 px-4">Credits</th>
                  <th className="pb-3 px-4">Amount</th>
                  <th className="pb-3 px-4">UTR Ref</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{req.orderReference}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{req.creditsClaimed} Credits</td>
                    <td className="py-3.5 px-4 text-slate-300">₹{req.amountClaimedInr}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{req.utrReference || '—'}</td>
                    <td className="py-3.5 px-4">
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          PENDING REVIEW
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          APPROVED & CREDITED
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                          REJECTED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
