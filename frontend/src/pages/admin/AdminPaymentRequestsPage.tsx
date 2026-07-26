import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Coins, CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, UserCheck, RefreshCw, Star } from 'lucide-react';

interface PaymentRequest {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  creditsClaimed: number;
  amountClaimedInr: number;
  orderReference: string;
  utrReference: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  createdAt: string;
}

interface UserSummary {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  paperCredits?: number;
  hasUnlimitedAccess?: boolean;
}

export const AdminPaymentRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState<PaymentRequest | null>(null);

  // Approval Modal State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [confirmedCredits, setConfirmedCredits] = useState<number>(5);
  const [confirmedAmount, setConfirmedAmount] = useState<number>(80);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Direct Override State
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [grantCreditAmount, setGrantCreditAmount] = useState<number>(5);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideMsg, setOverrideMsg] = useState<string | null>(null);

  const fetchRequestsAndUsers = async () => {
    setLoading(true);
    try {
      const res: any = await axiosClient.get('/admin/payment-requests');
      setRequests(res.data ?? res ?? []);

      const userRes: any = await axiosClient.get('/admin/users');
      const fetchedUsers = userRes.data ?? userRes ?? [];
      setUsers(fetchedUsers);
      if (fetchedUsers.length > 0 && !targetUserId) {
        setTargetUserId(fetchedUsers[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load payment requests / users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestsAndUsers();
  }, []);

  const openApproveModal = (req: PaymentRequest) => {
    setSelectedReq(req);
    setConfirmedCredits(req.creditsClaimed);
    setConfirmedAmount(req.amountClaimedInr);
    setAdminNotes('Payment verified via UPI bank statement');
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setProcessing(true);
    try {
      await axiosClient.post(`/admin/payment-requests/${selectedReq.id}/approve`, {
        confirmedCredits,
        confirmedAmountInr: confirmedAmount,
        adminNotes,
      });
      setShowApproveModal(false);
      fetchRequestsAndUsers();
    } catch (err: any) {
      alert('Failed to approve payment request: ' + (err?.message || 'Error'));
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (req: PaymentRequest) => {
    setSelectedReq(req);
    setRejectReason('Invalid UTR / Payment not received in bank statement');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    setProcessing(true);
    try {
      await axiosClient.post(`/admin/payment-requests/${selectedReq.id}/reject`, {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      fetchRequestsAndUsers();
    } catch (err: any) {
      alert('Failed to reject payment request: ' + (err?.message || 'Error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectGrant = async () => {
    if (!targetUserId) return;
    setProcessing(true);
    setOverrideMsg(null);
    try {
      await axiosClient.post(`/admin/users/${targetUserId}/credits/grant`, {
        credits: grantCreditAmount,
        reason: overrideReason || 'Admin complimentary grant',
      });
      setOverrideMsg(`Successfully granted ${grantCreditAmount} credits.`);
      fetchRequestsAndUsers();
    } catch (err: any) {
      setOverrideMsg('Failed: ' + (err?.message || 'Error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDirectRevoke = async () => {
    if (!targetUserId) return;
    setProcessing(true);
    setOverrideMsg(null);
    try {
      await axiosClient.post(`/admin/users/${targetUserId}/credits/revoke`, {
        credits: grantCreditAmount,
        reason: overrideReason || 'Admin credit revocation',
      });
      setOverrideMsg(`Successfully revoked ${grantCreditAmount} credits.`);
      fetchRequestsAndUsers();
    } catch (err: any) {
      setOverrideMsg('Failed: ' + (err?.message || 'Error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleUnlimited = async (user: UserSummary, currentStatus: boolean) => {
    setProcessing(true);
    try {
      await axiosClient.post(`/admin/users/${user.id}/unlimited-access`, {
        enabled: !currentStatus,
        reason: 'Admin VIP pass toggle',
      });
      fetchRequestsAndUsers();
    } catch (err: any) {
      alert('Failed to toggle unlimited access: ' + (err?.message || 'Error'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Coins className="w-8 h-8 text-cyan-400" />
            Payment Requests & Credit Administration
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Review candidate UPI payment claims, approve credits, or grant direct complimentary access.
          </p>
        </div>

        <button
          onClick={fetchRequestsAndUsers}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Admin Direct Override Control Panel */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          Admin Direct Grant, Revoke & Unlimited VIP Pass Controls
        </h2>

        {overrideMsg && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs">
            {overrideMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Candidate User</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Credits Count</label>
            <input
              type="number"
              min="1"
              max="100"
              value={grantCreditAmount}
              onChange={(e) => setGrantCreditAmount(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Reason</label>
            <input
              type="text"
              placeholder="e.g. Scholarship / Admin Grant"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDirectGrant}
              disabled={processing}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
            >
              + Grant Credits
            </button>
            <button
              onClick={handleDirectRevoke}
              disabled={processing}
              className="flex-1 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-all"
            >
              - Revoke
            </button>
          </div>
        </div>
      </div>

      {/* Payment Claims List */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          UPI Payment Requests (Pending First)
        </h2>

        {requests.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">No payment claims found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 px-4">Candidate</th>
                  <th className="pb-3 px-4">Order Ref</th>
                  <th className="pb-3 px-4">Claimed Credits</th>
                  <th className="pb-3 px-4">Claimed Amount</th>
                  <th className="pb-3 px-4">UTR Ref</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{req.studentName}</div>
                      <div className="text-[10px] text-slate-400">{req.studentEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{req.orderReference}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{req.creditsClaimed} Credits</td>
                    <td className="py-3.5 px-4 text-slate-300">₹{req.amountClaimedInr}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{req.utrReference || '—'}</td>
                    <td className="py-3.5 px-4">
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold animate-pulse">
                          PENDING
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          APPROVED
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                          REJECTED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openApproveModal(req)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(req)}
                            className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">{req.adminNotes || 'Processed'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User VIP Access Toggle List */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Candidate Credit Balances & Unlimited VIP Pass Toggles
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 px-4">User</th>
                <th className="pb-3 px-4">Current Credits</th>
                <th className="pb-3 px-4">Unlimited Access VIP Pass</th>
                <th className="pb-3 px-4 text-right">Toggle Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-cyan-400 font-bold">{u.paperCredits || 0} Credits</td>
                  <td className="py-3.5 px-4">
                    {u.hasUnlimitedAccess ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        ⭐ UNLIMITED ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-500">Standard</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleUnlimited(u, !!u.hasUnlimitedAccess)}
                      disabled={processing}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        u.hasUnlimitedAccess
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      {u.hasUnlimitedAccess ? 'Revoke VIP Pass' : 'Grant Unlimited VIP'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {showApproveModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 bg-slate-900 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Approve Payment Claim</h3>
            <p className="text-xs text-slate-400">
              Confirm bank statement receipt for Order Ref: <span className="text-cyan-400 font-mono">{selectedReq.orderReference}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmed Credits to Grant</label>
                <input
                  type="number"
                  value={confirmedCredits}
                  onChange={(e) => setConfirmedCredits(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmed Amount Received (INR)</label>
                <input
                  type="number"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Audit Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Confirm & Grant Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 bg-slate-900 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Reject Payment Claim</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
