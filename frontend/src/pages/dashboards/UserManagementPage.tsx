import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  X,
  Edit3
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

interface UserItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showRolesModal, setShowRolesModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form Fields
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newFirstName, setNewFirstName] = useState<string>('');
  const [newLastName, setNewLastName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('ROLE_STUDENT');

  // Role Edit Checkboxes
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  // Password Reset Field
  const [resetPasswordVal, setResetPasswordVal] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    axiosClient.get('/admin/users')
      .then((res: any) => {
        const data = res.data || res;
        setUsers(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load users:', err);
        setError(err?.message || 'Failed to fetch user directory');
      })
      .finally(() => setLoading(false));
  };

  const handleToggleStatus = (user: UserItem) => {
    const newStatus = !user.isActive;
    axiosClient.put(`/admin/users/${user.id}/status?active=${newStatus}`)
      .then(() => fetchUsers())
      .catch((err: any) => {
        console.error('Toggle status failed:', err);
        alert(err?.message || 'Failed to update user status');
      });
  };

  const handleOpenCreateUser = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewFirstName('');
    setNewLastName('');
    setNewRole('ROLE_STUDENT');
    setShowCreateModal(true);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      username: newUsername,
      email: newEmail,
      password: newPassword,
      firstName: newFirstName,
      lastName: newLastName,
      role: newRole,
    };

    axiosClient.post('/admin/users', payload)
      .then(() => {
        setShowCreateModal(false);
        fetchUsers();
      })
      .catch((err: any) => {
        console.error('Create user failed:', err);
        alert(err?.message || 'Failed to create user');
      })
      .finally(() => setSubmitting(false));
  };

  const handleOpenEditRoles = (user: UserItem) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setShowRolesModal(true);
  };

  const handleUpdateRolesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);

    axiosClient.put(`/admin/users/${selectedUser.id}/roles`, { roles: selectedRoles })
      .then(() => {
        setShowRolesModal(false);
        fetchUsers();
      })
      .catch((err: any) => {
        console.error('Update roles failed:', err);
        alert(err?.message || 'Failed to update roles');
      })
      .finally(() => setSubmitting(false));
  };

  const handleOpenResetPassword = (user: UserItem) => {
    setSelectedUser(user);
    setResetPasswordVal('');
    setShowPasswordModal(true);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);

    axiosClient.post(`/admin/users/${selectedUser.id}/reset-password`, { newPassword: resetPasswordVal })
      .then(() => {
        alert(`Password for ${selectedUser.username} has been reset successfully.`);
        setShowPasswordModal(false);
      })
      .catch((err: any) => {
        console.error('Reset password failed:', err);
        alert(err?.message || 'Failed to reset password');
      })
      .finally(() => setSubmitting(false));
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchRole = roleFilter === 'ALL' || u.roles.some(r => r.toUpperCase().includes(roleFilter));
    return matchSearch && matchRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">User & Role Directory Console</h1>
            <p className="text-xs text-slate-400">Total Registered Users: {users.length}</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateUser}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 inline-flex items-center justify-center gap-2 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Create New User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search username, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold text-slate-400">
          {[
            { label: 'All Users', key: 'ALL' },
            { label: 'Students', key: 'STUDENT' },
            { label: 'Examiners', key: 'EXAMINER' },
            { label: 'Admins', key: 'ADMIN' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setRoleFilter(item.key)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                roleFilter === item.key ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30' : 'hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">User / Username</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Assigned Roles</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{u.firstName} {u.lastName}</div>
                      <div className="text-[10px] text-purple-400 font-mono">@{u.username}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.includes('ADMIN')
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                : r.includes('EXAMINER')
                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {r.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditRoles(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold inline-flex items-center gap-1 transition-all"
                          title="Edit User Roles"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Roles
                        </button>
                        <button
                          onClick={() => handleOpenResetPassword(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1 transition-all"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" /> Reset Pwd
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full glass-panel bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Create New System User</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Initial Primary Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ROLE_STUDENT">ROLE_STUDENT</option>
                  <option value="ROLE_EXAMINER">ROLE_EXAMINER</option>
                  <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Roles Modal */}
      {showRolesModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full glass-panel bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Update Roles for @{selectedUser.username}</h2>
              <button onClick={() => setShowRolesModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRolesSubmit} className="space-y-4 text-xs">
              <div className="space-y-2">
                {['ROLE_STUDENT', 'ROLE_EXAMINER', 'ROLE_ADMIN'].map((r) => (
                  <label key={r} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(r)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, r]);
                        } else {
                          setSelectedRoles(selectedRoles.filter(role => role !== r));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="font-bold text-white">{r}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRolesModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg"
                >
                  {submitting ? 'Saving...' : 'Save Roles'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-md w-full glass-panel bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Reset Password (@{selectedUser.username})</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-lg"
                >
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
