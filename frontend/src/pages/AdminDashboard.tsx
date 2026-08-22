import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserPlus, UserX, UserCheck, ShieldAlert, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';

type UserData = {
  id: number;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
  _count: { progress: number };
};

export default function AdminDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('STUDENT');
  const [formError, setFormError] = useState('');

  if (authLoading) {
    return <div className="p-8 text-slate-400">Loading...</div>;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/admin/users/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`http://localhost:3000/api/admin/users/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setNewEmail('');
        setNewPassword('');
        fetchUsers();
      } else {
        setFormError(data.message || 'Failed to create user');
      }
    } catch (err) {
      setFormError('Connection error');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[#0A0A0F] rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      
      {/* Sidebar */}
      <div className="w-80 bg-[#12121A] border-r border-white/5 flex flex-col p-6">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mb-8">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          Admin Console
        </h2>
        
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Manage platform access. Newly registered users require your explicit approval before they can authenticate.
        </p>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
        >
          <UserPlus className="w-5 h-5" /> Create New User
        </button>

        <div className="mt-auto">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Active Admin</p>
              <p className="text-slate-400 text-xs truncate max-w-[150px]">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <h3 className="text-2xl font-bold text-white mb-6">User Management</h3>
        
        {isLoading ? (
          <div className="text-slate-400">Loading users...</div>
        ) : (
          <div className="bg-[#12121A] rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="text-white font-medium">{u.email}</div>
                      <div className="text-xs text-slate-500 mt-1">Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.isApproved ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                          <UserCheck className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded w-fit border border-amber-500/20">
                          <UserX className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sky-400 font-mono text-sm">{u._count.progress} Labs Solved</div>
                    </td>
                    <td className="p-4 text-right">
                      {!u.isApproved && (
                        <button 
                          onClick={() => handleApprove(u.id)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold text-sm bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded mr-2 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {u.id !== user?.id && (
                        <button 
                          onClick={() => handleReject(u.id)}
                          className="text-rose-400 hover:text-rose-300 font-bold text-sm bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-slate-500">No users found.</div>
            )}
          </div>
        )}

      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12121A] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Create User</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              {formError && <div className="text-rose-400 text-sm font-medium">{formError}</div>}
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-lg font-bold text-slate-300 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
