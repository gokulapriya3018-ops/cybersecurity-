import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Save, CheckCircle } from 'lucide-react';

export default function ProfileSettings() {
  const { user, token, login } = useAuth();
  
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email, password: password || undefined })
      });
      const data = await res.json();
      
      if (data.ok) {
        // Update context with the new token and user object
        login(data.token, data.user);
        setMessage('Profile updated successfully');
        setPassword(''); // Clear password field after save
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-2xl bg-[#0A0A0F] rounded-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden mt-10">
        
        {/* Header Section */}
        <div className="p-8 border-b border-white/5 bg-[#12121A] flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-white/10 flex items-center justify-center text-3xl font-bold text-white uppercase shadow-inner">
            {user?.email?.substring(0,2)}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Profile Settings</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${user?.role === 'ADMIN' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                {user?.role}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Approved
              </span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {message && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-bold">
              <CheckCircle className="w-5 h-5" />
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Change Password
              </label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
