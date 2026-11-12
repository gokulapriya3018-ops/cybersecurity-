import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Users, Zap, Trophy, Clock, Search, CheckCircle2, 
  AlertTriangle, Radio, Download, RefreshCw, Terminal,
  Lock, Trash2, Key, Target, Flame, Database, UserPlus, Sparkles, X, Eye, EyeOff
} from 'lucide-react';

export default function AdminSOCDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Dashboard Data State
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'roster' | 'leaderboard' | 'heatmap' | 'events'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'PENDING' | 'APPROVED' | 'FLAGGED'>('ALL');
  const [sortBy, setSortBy] = useState<'LABS' | 'XP' | 'BADGES' | 'HOURS' | 'NEWEST'>('LABS');

  // Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');

  // Add User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [newIsApproved, setNewIsApproved] = useState(true);
  const [newInitialXp, setNewInitialXp] = useState(0);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Fetch all SOC telemetry
  const fetchSOCData = async () => {
    if (!token) return;
    try {
      const [sumRes, studRes] = await Promise.all([
        fetch('http://localhost:3000/api/admin/soc-summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3000/api/admin/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (sumRes.status === 401 || studRes.status === 401) {
        logout();
        navigate('/login?expired=true');
        return;
      }

      const sumData = await sumRes.json();
      const studData = await studRes.json();

      if (sumData.ok) setSummary(sumData);
      if (studData.ok) setStudents(studData.students);
    } catch (err) {
      console.error('Failed to load SOC dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSOCData();
    const interval = setInterval(fetchSOCData, 15000); // 15s auto-refresh for live telemetry
    return () => clearInterval(interval);
  }, [token]);

  // Open Deep-Dive Operator Dossier Page
  const handleOpenDossier = (studentId: number) => {
    navigate(`/admin/operator/${studentId}`);
  };

  // Actions
  const handleApprove = async (id: number) => {
    await fetch(`http://localhost:3000/api/admin/users/${id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchSOCData();
  };

  const handleRevoke = async (id: number) => {
    await fetch(`http://localhost:3000/api/admin/users/${id}/revoke`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchSOCData();
  };

  const handleKick = async (id: number) => {
    await fetch(`http://localhost:3000/api/admin/students/${id}/kick`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchSOCData();
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Delete operator account permanently?')) return;
    await fetch(`http://localhost:3000/api/admin/users/${id}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchSOCData();
  };

  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:3000/api/admin/broadcasts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: broadcastTitle, message: broadcastMsg, type: broadcastType })
    });
    setShowBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastMsg('');
    fetchSOCData();
  };

  const handleFlushSandboxes = async () => {
    if (!window.confirm('Flush all XSS demo comments, tickets, and simulation logs? (Student accounts will remain untouched).')) return;
    await fetch('http://localhost:3000/api/admin/sandbox/reset', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    alert('Sandboxes flushed successfully.');
    fetchSOCData();
  };

  // Generate random strong password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let gen = 'CSA-';
    for (let i = 0; i < 9; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
  };

  // Provision new user
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    setAddUserSuccess('');
    setIsSubmittingUser(true);

    try {
      const res = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          isApproved: newIsApproved,
          initialXp: Number(newInitialXp) || 0
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAddUserError(data.message || 'Failed to provision operator');
        setIsSubmittingUser(false);
        return;
      }

      setAddUserSuccess(`Operator ${data.user?.email || newEmail} successfully enrolled!`);
      setTimeout(() => {
        setShowAddUserModal(false);
        setNewEmail('');
        setNewPassword('');
        setNewRole('STUDENT');
        setNewIsApproved(true);
        setNewInitialXp(0);
        setAddUserSuccess('');
        setIsSubmittingUser(false);
        fetchSOCData();
      }, 1000);
    } catch (err: any) {
      setAddUserError(err.message || 'Network error provisioning operator');
      setIsSubmittingUser(false);
    }
  };

  // Export CSV of students
  const handleExportCSV = () => {
    const headers = ['ID', 'Email', 'Role', 'Approved', 'XP', 'Level', 'TotalSolved', 'SQLiSolved', 'XSSSolved', 'BadgesCount', 'ActiveHours', 'LatestIP', 'CreatedAt'];
    const rows = students.map(s => [
      s.id,
      s.email,
      s.role,
      s.isApproved,
      s.xp,
      s.level,
      s.totalSolved,
      s.sqliSolved,
      s.xssSolved,
      s.badgesCount,
      s.activeHours,
      s.latestIp,
      new Date(s.createdAt).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cybersec_academy_operators_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort Students (Strictly Students only, never admins)
  const filteredStudents = students.filter(s => {
    if (s.role === 'ADMIN') return false;

    const matchesSearch = s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.latestIp.includes(searchQuery);
    if (!matchesSearch) return false;

    if (statusFilter === 'ONLINE') return s.isOnline;
    if (statusFilter === 'PENDING') return !s.isApproved;
    if (statusFilter === 'APPROVED') return s.isApproved;
    if (statusFilter === 'FLAGGED') return s.anomalyFlags > 0;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'LABS') return b.totalSolved - a.totalSolved;
    if (sortBy === 'XP') return b.xp - a.xp;
    if (sortBy === 'BADGES') return b.badgesCount - a.badgesCount;
    if (sortBy === 'HOURS') return b.activeMinutes - a.activeMinutes;
    if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const t = summary?.telemetry;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 font-mono text-sm">
        <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping mr-3" />
        CONNECTING TO SOC COMMAND RADAR...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 w-full max-w-7xl 2xl:max-w-[1600px] mx-auto py-2">
      
      {/* ─────────────────────────────────────────────────────────────
          SOC COMMAND HUD & TELEMETRY BANNER
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-[#07130F] via-[#0B0D18] to-[#120D1A] p-6 lg:p-8 shadow-2xl">
        {/* Animated Cyber Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                SOC CYBER COMMAND ACTIVE
              </span>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">PGSQL CLUSTER 15432 • SECURE</span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
              Instructor Command & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Student Telemetry</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time audit telemetry across all enrolled operators. Track lab progression velocity, claimed badges, active login sessions, and detect impossible solve velocity anomalies.
            </p>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
            <button
              onClick={() => {
                setAddUserError('');
                setAddUserSuccess('');
                setShowAddUserModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-mono font-black transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>Enroll Operator</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-bold transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Audit CSV</span>
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold transition-all shadow-sm"
            >
              <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Broadcast Threat Alert</span>
            </button>

            <button
              onClick={handleFlushSandboxes}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-mono font-bold transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>Flush Sandboxes</span>
            </button>
          </div>

        </div>

        {/* 5 Live Metric HUD Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-8 relative z-10">
          
          <div className="bg-[#0B0D14]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Operators</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{t?.totalOperators || 0}</span>
              {t?.pendingApprovals > 0 && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {t?.pendingApprovals} Pending
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#0B0D14]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Live Active</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">{t?.onlineOperators || 0}</span>
              <span className="text-[11px] text-slate-500">online now</span>
            </div>
          </div>

          <div className="bg-[#0B0D14]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Lab Breaches</span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{t?.totalBreaches || 0}</span>
              <span className="text-[11px] text-slate-500">solves recorded</span>
            </div>
          </div>

          <div className="bg-[#0B0D14]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Badges Claimed</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{t?.totalBadgesClaimed || 0}</span>
              <span className="text-[11px] text-slate-500">achievements</span>
            </div>
          </div>

          <div className="bg-[#0B0D14]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Training Hours</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{t?.totalHoursTracked || 0}h</span>
              <span className="text-[11px] text-slate-500">time invested</span>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SOC NAVIGATION TABS (Roster | Leaderboard | Heatmap | Events)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-[#12121A] p-1.5 rounded-2xl border border-white/5">
          
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'roster'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Operator Intelligence Roster</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/30 font-mono">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Class Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'heatmap'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Lab Difficulty Heatmap</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/30 font-mono">
              20 Labs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Security Event Terminal</span>
          </button>

        </div>

        {/* Search Bar (Only on Roster Tab) */}
        {activeTab === 'roster' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search operator email or IP..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#12121A] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-64 transition-all"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[#12121A] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
            >
              <option value="LABS">Sort: Most Labs</option>
              <option value="XP">Sort: Most XP</option>
              <option value="BADGES">Sort: Most Badges</option>
              <option value="HOURS">Sort: Most Hours</option>
              <option value="NEWEST">Sort: Newest</option>
            </select>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: OPERATOR INTELLIGENCE ROSTER
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'roster' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Status Filter Pills & Quick Enroll */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {(['ALL', 'ONLINE', 'PENDING', 'APPROVED', 'FLAGGED'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                    statusFilter === filter
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {filter === 'ALL' && `All (${students.length})`}
                  {filter === 'ONLINE' && `🟢 Online (${students.filter(s => s.isOnline).length})`}
                  {filter === 'PENDING' && `Pending (${students.filter(s => !s.isApproved).length})`}
                  {filter === 'APPROVED' && `Approved (${students.filter(s => s.isApproved).length})`}
                  {filter === 'FLAGGED' && `⚠️ Flagged (${students.filter(s => s.anomalyFlags > 0).length})`}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setAddUserError('');
                setAddUserSuccess('');
                setShowAddUserModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-mono font-black transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>+ Enroll New Operator</span>
            </button>
          </div>

          {/* Student Roster Table */}
          <div className="bg-[#0E0E16] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-[#141420] text-xs font-mono uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Operator Call Sign</th>
                    <th className="px-6 py-4">Clearance</th>
                    <th className="px-6 py-4">Labs Mastered (SQLi / XSS)</th>
                    <th className="px-6 py-4">Badges & Level</th>
                    <th className="px-6 py-4">Hours Trained</th>
                    <th className="px-6 py-4">Latest Login Telemetry</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-mono text-xs">
                        No operators matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                        
                        {/* Operator Call Sign */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white uppercase text-sm shadow-inner">
                                {student.email.substring(0, 2)}
                              </div>
                              <span 
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0E0E16] ${
                                  student.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                                }`} 
                                title={student.isOnline ? 'Online Now' : 'Offline'}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{student.email}</span>
                                {student.anomalyFlags > 0 && (
                                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {student.anomalyFlags} Anomaly
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                Registered: {new Date(student.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Clearance Status */}
                        <td className="px-6 py-4 font-mono">
                          {student.isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                              <Clock className="w-3.5 h-3.5" />
                              Pending Review
                            </span>
                          )}
                        </td>

                        {/* Labs Mastered Breakdown */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5 w-48">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-white font-bold">{student.totalSolved} / 20</span>
                              <span className="text-slate-400 text-[11px]">
                                SQLi: <strong className="text-indigo-400">{student.sqliSolved}</strong> | XSS: <strong className="text-purple-400">{student.xssSolved}</strong>
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                                style={{ width: `${Math.round((student.totalSolved / 20) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Badges & Level */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                              <Trophy className="w-3.5 h-3.5" />
                              <span>{student.badgesCount} Badges</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                              <Zap className="w-3.5 h-3.5" />
                              <span>LVL {student.level}</span>
                            </div>
                          </div>
                        </td>

                        {/* Hours Trained */}
                        <td className="px-6 py-4 font-mono text-xs">
                          <span className="text-white font-bold">{student.activeHours}h</span>
                          <span className="text-slate-500 ml-1">({student.activeMinutes}m)</span>
                        </td>

                        {/* Latest Login Telemetry */}
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="text-slate-300 font-semibold">{student.latestIp}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[140px]" title={student.latestUserAgent}>
                            {student.latestUserAgent}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenDossier(student.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition-all"
                            >
                              Inspect Dossier
                            </button>

                            {student.isApproved ? (
                              <button
                                onClick={() => handleRevoke(student.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold transition-all"
                                title="Freeze access"
                              >
                                Freeze
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprove(student.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-mono font-black transition-all"
                                title="Approve account"
                              >
                                Approve
                              </button>
                            )}

                            <button
                              onClick={() => handleKick(student.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                              title="Kill active sessions"
                            >
                              <Lock className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(student.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                              title="Delete student"
                            >
                              <Trash2 className="w-4 h-4" />
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

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: CLASS LEADERBOARD & STANDINGS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {summary?.leaderboard?.slice(0, 3).map((item: any, idx: number) => {
              const borderColors = [
                'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-[#0E0E16]',
                'border-slate-400/40 bg-gradient-to-b from-slate-900/30 to-[#0E0E16]',
                'border-orange-500/40 bg-gradient-to-b from-orange-950/20 to-[#0E0E16]'
              ];
              const medals = ['👑 1ST PLACE', '🥈 2ND PLACE', '🥉 3RD PLACE'];

              return (
                <div key={item.id} className={`rounded-3xl border p-6 text-center space-y-4 shadow-xl relative overflow-hidden ${borderColors[idx]}`}>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-white/5 border border-white/10 text-amber-400">
                    {medals[idx]}
                  </div>

                  <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-2xl font-black text-white uppercase shadow-inner">
                    {item.email.substring(0, 2)}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white truncate">{item.email}</h3>
                    <p className="text-xs font-mono text-emerald-400 mt-0.5">LEVEL {item.level} OPERATOR • {item.xp} XP</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                    <div className="bg-white/5 p-2 rounded-xl">
                      <div className="text-slate-500 text-[10px]">LABS SOLVED</div>
                      <div className="text-base font-bold text-white">{item.totalSolved} / 20</div>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl">
                      <div className="text-slate-500 text-[10px]">BADGES EARNED</div>
                      <div className="text-base font-bold text-amber-400">{item.badgesCount}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete Standings Table */}
          <div className="bg-[#0E0E16] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Full Class Standings</span>
            </div>

            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-[#141420] text-xs font-mono uppercase text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Level & XP</th>
                  <th className="px-6 py-4">Labs Mastered</th>
                  <th className="px-6 py-4">Badges</th>
                  <th className="px-6 py-4">Active Training</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {summary?.leaderboard?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-bold text-white">#{item.rank}</td>
                    <td className="px-6 py-4 text-white font-sans font-bold">{item.email}</td>
                    <td className="px-6 py-4 text-indigo-400 font-bold">LVL {item.level} ({item.xp} XP)</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">{item.totalSolved} / 20</td>
                    <td className="px-6 py-4 text-amber-400 font-bold">{item.badgesCount} Badges</td>
                    <td className="px-6 py-4 text-slate-300">{item.activeHours} hours</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: LAB DIFFICULTY HEATMAP & SANDBOX DIAGNOSTICS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Infrastructure Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0E0E16] border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-400" />
                  POSTGRESQL CLUSTER
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {summary?.sandboxStatus?.pgsqlCluster?.status}
                </span>
              </div>
              <div className="text-xl font-bold text-white font-mono">15432 / TCP</div>
              <div className="text-xs text-slate-500 font-mono">Query Latency: {summary?.sandboxStatus?.pgsqlCluster?.latency} • 10 SQLi Tables Loaded</div>
            </div>

            <div className="bg-[#0E0E16] border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  XSS CLIENT ENGINE
                </span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {summary?.sandboxStatus?.xssCluster?.status}
                </span>
              </div>
              <div className="text-xl font-bold text-white font-mono">10 Sandbox APIs</div>
              <div className="text-xs text-slate-500 font-mono">Comments, Profiles, Tickets & Bot Queue Active</div>
            </div>

            <div className="bg-[#0E0E16] border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-cyan-400" />
                  AUTH SESSIONS CLUSTER
                </span>
                <span className="text-emerald-400 font-bold">
                  {summary?.sandboxStatus?.authCluster?.status}
                </span>
              </div>
              <div className="text-xl font-bold text-white font-mono">{summary?.sandboxStatus?.authCluster?.activeSessions} Tokens</div>
              <div className="text-xs text-slate-500 font-mono">Active Database Refresh Sessions Active</div>
            </div>
          </div>

          {/* 20-Lab Difficulty Table */}
          <div className="bg-[#0E0E16] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>Curriculum Difficulty & Completion Heatmap</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Identifies which sandboxes present the highest cognitive friction and solve time.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-[#141420] text-xs font-mono uppercase text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Lab Identifier</th>
                    <th className="px-6 py-4">Track</th>
                    <th className="px-6 py-4">Difficulty Rating</th>
                    <th className="px-6 py-4">Class Solve Rate</th>
                    <th className="px-6 py-4">Average Solve Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {summary?.labDifficulty?.map((lab: any) => (
                    <tr key={lab.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-white">{lab.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          lab.track === 'SQLi' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {lab.track}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        <span className={`px-2.5 py-0.5 rounded ${
                          lab.tier === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          lab.tier === 'HARD' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          lab.tier === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {lab.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-400 rounded-full" 
                              style={{ width: `${lab.completionRate}%` }} 
                            />
                          </div>
                          <span className="text-white font-bold">{lab.completionRate}% ({lab.solveCount} solved)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-bold">{lab.avgDuration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: LIVE SECURITY EVENT STREAM TERMINAL
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>Real-Time Security Event Stream</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Auto-refreshing live socket</span>
          </div>

          <div className="bg-[#090A10] border border-white/10 rounded-3xl p-6 font-mono text-xs space-y-3 shadow-2xl">
            {summary?.recentEvents?.length === 0 ? (
              <div className="text-slate-500 text-center py-12">No security events recorded yet.</div>
            ) : (
              summary?.recentEvents?.map((evt: any) => {
                let badgeStyle = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
                if (evt.eventType === 'LAB_BREACH') badgeStyle = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                if (evt.eventType === 'BADGE_CLAIMED') badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                if (evt.eventType === 'ANOMALY_WARNING') badgeStyle = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                if (evt.eventType === 'ADMIN_ACTION') badgeStyle = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';

                return (
                  <div key={evt.id} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-slate-500 flex-shrink-0">
                      [{new Date(evt.createdAt).toLocaleTimeString()}]
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase flex-shrink-0 ${badgeStyle}`}>
                      {evt.eventType}
                    </span>
                    <span className="text-slate-300 flex-1">
                      {evt.description}
                      {evt.email && <span className="text-indigo-400 ml-2">({evt.email})</span>}
                    </span>
                    {evt.metadata && (
                      <span className="text-slate-500 text-[11px] truncate max-w-xs">
                        {evt.metadata}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────
          BROADCAST ALERT MODAL
         ───────────────────────────────────────────────────────────── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0E0E17] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span>Broadcast Flash Threat Alert</span>
            </h3>

            <form onSubmit={handlePublishBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">ALERT SEVERITY</label>
                <select
                  value={broadcastType}
                  onChange={e => setBroadcastType(e.target.value as any)}
                  className="w-full bg-[#141420] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  <option value="INFO">INFO (Blue Announcement)</option>
                  <option value="WARNING">WARNING (Amber Alert)</option>
                  <option value="CRITICAL">CRITICAL (Red Threat Advisory)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">ALERT TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH CHALLENGE ACTIVE"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  className="w-full bg-[#141420] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">MESSAGE FOR STUDENTS</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Double XP awarded for all XSS labs completed in the next 2 hours."
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  className="w-full bg-[#141420] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs font-mono shadow-lg shadow-indigo-600/30"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ENROLL NEW OPERATOR
         ───────────────────────────────────────────────────────────── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#141422] via-[#0E0E18] to-[#0A0A12] border border-emerald-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-60 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Enroll New Operator
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    PROVISION IDENTITY // CSA-AUTH-PROV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Banners */}
            {addUserError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{addUserError}</span>
              </div>
            )}
            {addUserSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{addUserSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddUserSubmit} className="mt-5 space-y-4">
              
              {/* Email Address */}
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1.5 block font-bold">
                  OPERATOR EMAIL / CALLSIGN <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="cadet@csa.local"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-[#10101A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-400 font-bold">
                    INITIAL ACCESS KEY (PASSWORD) <span className="text-emerald-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline underline-offset-2"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong Key</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter or generate password..."
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-[#10101A] border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1.5 block font-bold">
                  OPERATOR ROLE & CLEARANCE LEVEL
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setNewRole('STUDENT')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      newRole === 'STUDENT'
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-[#10101A] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className={newRole === 'STUDENT' ? 'text-emerald-300' : 'text-slate-300'}>STUDENT</span>
                      {newRole === 'STUDENT' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Access to offensive training sandboxes & courses.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewRole('ADMIN')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      newRole === 'ADMIN'
                        ? 'bg-indigo-500/15 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                        : 'bg-[#10101A] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className={newRole === 'ADMIN' ? 'text-indigo-300' : 'text-slate-300'}>ADMIN</span>
                      {newRole === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Full instructor command & student telemetry access.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Approval & Initial XP */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-mono text-slate-400 mb-1.5 block font-bold">
                    INSTANT APPROVAL
                  </label>
                  <select
                    value={newIsApproved ? 'true' : 'false'}
                    onChange={e => setNewIsApproved(e.target.value === 'true')}
                    className="w-full bg-[#10101A] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                  >
                    <option value="true">Approved (Active Login)</option>
                    <option value="false">Pending Approval</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 mb-1.5 block font-bold">
                    STARTING XP BONUS
                  </label>
                  <select
                    value={newInitialXp}
                    onChange={e => setNewInitialXp(Number(e.target.value))}
                    className="w-full bg-[#10101A] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                  >
                    <option value={0}>0 XP (Trainee - Lvl 1)</option>
                    <option value={100}>100 XP (Cadet - Lvl 2)</option>
                    <option value={400}>400 XP (Operator - Lvl 3)</option>
                    <option value={900}>900 XP (Veteran - Lvl 4)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs font-mono shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-slate-950" />
                  <span>{isSubmittingUser ? 'PROVISIONING...' : 'ENROLL OPERATOR IDENTITY'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
