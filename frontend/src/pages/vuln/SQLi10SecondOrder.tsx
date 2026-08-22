import { useState } from 'react';
import { ShieldAlert, UserCircle, Save, Key, Activity } from 'lucide-react';

export default function SQLi10SecondOrder() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'view'>('edit');
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded ID for the lab user
  const LAB_USER_ID = 2; 

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setQueryExecuted('');
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab10/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: LAB_USER_ID, username, bio })
      });
      const responseData = await res.json();
      
      if (responseData.ok) {
        setMessage('Profile updated successfully (Safe Operation). Switch to View Profile to see it.');
      } else {
        setError(responseData.error || 'Server error');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewProfile = async () => {
    setError('');
    setMessage('');
    setQueryExecuted('');
    setIsLoading(true);
    
    try {
      const res = await fetch(`http://localhost:3000/api/sims/sqli/lab10/profile/${LAB_USER_ID}/view`, {
        method: 'GET'
      });
      const responseData = await res.json();
      
      setQueryExecuted(responseData.query || '');
      
      if (responseData.ok) {
        setProfileData(responseData.raw_results);
        if (responseData.injected) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(responseData.error || 'Server error');
        setProfileData(null);
      }
    } catch (err) {
      setError('Connection error.');
      setProfileData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tab: 'edit' | 'view') => {
    setActiveTab(tab);
    if (tab === 'view') {
      viewProfile();
    }
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        
        {success && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Second-Order Injection Successful</h3>
              <p className="text-emerald-700 mb-2">You successfully exploited the system by inserting a payload safely, then triggering it when viewed!</p>
              <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}S3C0ND_0RD3R_M4ST3R{'}'}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => switchTab('edit')}
              className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'edit' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <UserCircle className="w-5 h-5" /> Edit Profile
            </button>
            <button 
              onClick={() => switchTab('view')}
              className={`flex-1 py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'view' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Activity className="w-5 h-5" /> View Profile
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'edit' && (
              <form onSubmit={updateProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-mono"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">This is safely parameterized upon insert.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Bio</label>
                  <textarea 
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                    rows={4}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold px-8 py-4 rounded-xl transition-colors flex items-center justify-center w-full gap-2 shadow-lg shadow-indigo-500/30"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <><Save className="w-5 h-5" /> Save Changes</>}
                </button>

                {message && (
                  <div className="text-emerald-600 font-medium bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="text-rose-600 font-medium bg-rose-50 px-4 py-3 rounded-xl border border-rose-200">
                    {error}
                  </div>
                )}
              </form>
            )}

            {activeTab === 'view' && (
              <div>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-rose-600 font-medium bg-rose-50 px-4 py-3 rounded-xl border border-rose-200">
                    {error}
                  </div>
                ) : profileData && profileData.length > 0 ? (
                  <div className="space-y-6">
                    {profileData.map((profile: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                              <UserCircle className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-xl">User Profile</h3>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-100 mb-4">
                          <p className="text-slate-600 italic">"{profile.bio}"</p>
                        </div>
                        {profile.secret_flag && (
                          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 flex items-center gap-3">
                            <Key className="w-5 h-5 text-rose-500" />
                            <div>
                              <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Leaked Secret</div>
                              <div className="font-mono text-rose-700">{profile.secret_flag}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">No profile data found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'view' && queryExecuted && (
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executed View Query</span>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">Vulnerable Point</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <code className="text-emerald-400 text-sm whitespace-pre-wrap font-mono">
                {queryExecuted}
              </code>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
