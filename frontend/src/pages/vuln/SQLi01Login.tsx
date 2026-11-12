import { useState } from 'react';
import { 
  Globe, Menu, Search, Bell, ChevronDown, ChevronRight,
  LayoutDashboard, Layout, Layers, FileText, Table, BarChart3, Map, 
  Lock, File, Eye, Music, Mail, Share2, Wifi, RotateCw, ShoppingCart, 
  Star, Trophy, MoreHorizontal, MessageSquare, Briefcase, UserCheck, 
  LogOut, Copy, Check
} from 'lucide-react';

export default function SQLi01Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const flag = 'CSA{SQLi_Byp4ss_M4st3r}';

  const copyFlag = () => {
    navigator.clipboard.writeText(flag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setSuccess(true);
        // Dispatch event to VulnLayout to mark lab as solved
        if (data.injected) {
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(data.message || data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-full bg-[#f4f7fa] font-sans text-slate-700 flex flex-col antialiased">
        
        {/* Top Solved Flag Alert Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-6 py-2.5 flex items-center justify-between shadow-md z-30">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <div className="text-xs font-semibold flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider">LAB SOLVED</span>
              <span>Authentication Bypassed! Welcome to internal Flat Able Enterprise Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-black/30 px-3 py-1 rounded border border-white/20 flex items-center gap-2 text-emerald-100">
              Flag: <span className="font-bold text-white">{flag}</span>
            </span>
            <button 
              onClick={copyFlag}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-medium flex items-center gap-1 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button 
              onClick={() => { setSuccess(false); setUsername(''); setPassword(''); }}
              className="px-2.5 py-1 bg-black/20 hover:bg-black/40 text-white rounded text-xs font-medium flex items-center gap-1 transition-all border border-white/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Flat Able Navigation Header */}
        <header className="bg-[#222B40] text-slate-300 h-14 flex items-center justify-between px-5 select-none shrink-0 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 text-white font-black text-lg tracking-wider pr-6 border-r border-slate-700/60">
              <Globe className="w-5 h-5 text-teal-400" />
              <span className="tracking-widest">FLAT ABLE</span>
            </div>
            
            {/* Menu Toggle */}
            <button className="text-slate-400 hover:text-white p-1 rounded transition-colors">
              <Menu className="w-4 h-4" />
            </button>

            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-[#1B2337] text-xs text-white placeholder-slate-500 pl-8 pr-3 py-1.5 rounded border border-slate-700/60 focus:outline-none focus:border-teal-500 w-44 transition-all"
                readOnly
              />
            </div>

            {/* Links */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="hover:text-white cursor-pointer flex items-center gap-1">Dropdown <ChevronDown className="w-3 h-3" /></span>
              <span className="hover:text-white cursor-pointer">Mega</span>
            </div>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <div className="relative cursor-pointer text-slate-400 hover:text-white">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                5
              </span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
                alt="John Doe" 
                className="w-7 h-7 rounded-full object-cover border border-teal-500/50"
              />
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </header>

        {/* App Body (Sidebar + Content) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Dark Sidebar */}
          <aside className="w-60 bg-[#1B2430] text-slate-400 text-xs flex flex-col shrink-0 select-none overflow-y-auto border-r border-slate-800">
            {/* User Profile Card */}
            <div className="p-4 flex items-center gap-3 border-b border-slate-800/80 bg-[#161D27]">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
                alt="John Doe" 
                className="w-9 h-9 rounded-full object-cover border-2 border-teal-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate flex items-center justify-between">
                  <span>John Doe</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-[11px] text-slate-400">UX Designer</div>
              </div>
            </div>

            {/* Sidebar Navigation Menu */}
            <div className="py-3 space-y-4">
              
              {/* Navigation Group */}
              <div>
                <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Navigation</div>
                <div className="space-y-0.5">
                  <div className="mx-2 px-3 py-2 bg-[#1abc9c] text-white font-semibold rounded flex items-center justify-between cursor-pointer shadow-sm shadow-teal-500/20">
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4 text-white" />
                      <span>Dashboard</span>
                    </div>
                  </div>
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Layout className="w-4 h-4 text-slate-400" />
                      <span>Page layouts</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* UI Element Group */}
              <div>
                <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">UI Element</div>
                <div className="space-y-0.5">
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>Basic</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Forms & Table Group */}
              <div>
                <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Forms & Table</div>
                <div className="space-y-0.5">
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center gap-2.5 cursor-pointer transition-colors">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Forms</span>
                  </div>
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center gap-2.5 cursor-pointer transition-colors">
                    <Table className="w-4 h-4 text-slate-400" />
                    <span>Bootstrap table</span>
                  </div>
                </div>
              </div>

              {/* Chart & Maps Group */}
              <div>
                <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chart & Maps</div>
                <div className="space-y-0.5">
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center gap-2.5 cursor-pointer transition-colors">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span>Chart</span>
                  </div>
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center gap-2.5 cursor-pointer transition-colors">
                    <Map className="w-4 h-4 text-slate-400" />
                    <span>Maps</span>
                  </div>
                </div>
              </div>

              {/* Pages Group */}
              <div>
                <div className="px-4 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pages</div>
                <div className="space-y-0.5">
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Authentication</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="mx-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded flex items-center gap-2.5 cursor-pointer transition-colors">
                    <File className="w-4 h-4 text-slate-400" />
                    <span>Sample page</span>
                  </div>
                </div>
              </div>

            </div>
          </aside>

          {/* Main Dashboard View */}
          <main className="flex-1 p-6 overflow-y-auto bg-[#f4f7fa]">
            
            {/* Breadcrumb Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard Analytics</h1>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <span>🏠</span>
                <span>/</span>
                <span className="text-slate-600 font-medium">Dashboard Analytics</span>
              </div>
            </div>

            {/* Top Metrics Row - 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              
              {/* Metric Card 1: Visitors, Volume, Files, Mails + Ratings */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden flex flex-col justify-between">
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 p-2">
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-emerald-500">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">10k</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">VISITORS</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-rose-400">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">100%</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">VOLUME</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-emerald-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">2000 +</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">FILES</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-amber-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">120</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">MAILS</div>
                    </div>
                  </div>
                </div>
                {/* Bottom Banner */}
                <div className="bg-[#1abc9c] text-white px-5 py-3 flex items-center gap-3">
                  <Star className="w-5 h-5 fill-white text-white" />
                  <div>
                    <span className="font-bold text-sm">4000 + </span>
                    <span className="text-xs text-teal-100">Ratings Received</span>
                  </div>
                </div>
              </div>

              {/* Metric Card 2: Shares, Network, Returns, Order + Achievements */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden flex flex-col justify-between">
                <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 p-2">
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-teal-500">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">1000</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">SHARES</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-teal-500">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">600</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">NETWORK</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-teal-500">
                      <RotateCw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">3550</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">RETURNS</div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center gap-3">
                    <div className="text-teal-500">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">100%</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">ORDER</div>
                    </div>
                  </div>
                </div>
                {/* Bottom Banner */}
                <div className="bg-[#1abc9c] text-white px-5 py-3 flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-white" />
                  <div>
                    <span className="font-bold text-sm">17 </span>
                    <span className="text-xs text-teal-100">Achievements</span>
                  </div>
                </div>
              </div>

              {/* Metric Card 3: Support Requests + Wave Sparkline */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden flex flex-col justify-between">
                <div className="p-5 pb-2">
                  <div className="text-2xl font-bold text-slate-800">350</div>
                  <div className="text-xs font-semibold text-teal-600 mt-0.5">Support Requests</div>
                  <div className="text-[11px] text-slate-400 mt-1">Total number of support requests that come in.</div>
                </div>

                {/* Smooth Area Wave Chart Graphic */}
                <div className="w-full px-2 pt-2">
                  <svg viewBox="0 0 300 70" className="w-full h-16 overflow-visible">
                    <defs>
                      <linearGradient id="supportWave" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1abc9c" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1abc9c" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,55 Q 40,50 75,30 T 150,40 T 225,15 T 300,35 L 300,70 L 0,70 Z"
                      fill="url(#supportWave)"
                    />
                    <path
                      d="M 0,55 Q 40,50 75,30 T 150,40 T 225,15 T 300,35"
                      fill="none"
                      stroke="#1abc9c"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* Bottom 3-Column Banner */}
                <div className="bg-[#1abc9c] text-white grid grid-cols-3 divide-x divide-teal-400/40 text-center py-2.5">
                  <div>
                    <div className="text-sm font-bold">10</div>
                    <div className="text-[10px] text-teal-100">Open</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">5</div>
                    <div className="text-[10px] text-teal-100">Running</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">3</div>
                    <div className="text-[10px] text-teal-100">Solved</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row - Projects Table & Latest Updates */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left: Projects Table (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-lg shadow-sm border border-slate-200/80 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-800">Projects</h2>
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                        <th className="pb-3 w-8">
                          <input type="checkbox" className="rounded text-teal-500 focus:ring-0 cursor-pointer" />
                        </th>
                        <th className="pb-3">ASSIGNED</th>
                        <th className="pb-3">NAME</th>
                        <th className="pb-3">DUE DATE</th>
                        <th className="pb-3 text-right">PRIORITY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {/* Project 1 */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3">
                          <input type="checkbox" className="rounded text-teal-500 focus:ring-0 cursor-pointer" />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
                              alt="John Deo" 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-800">John Deo</div>
                              <div className="text-[11px] text-slate-400">Graphics Designer</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">Able Pro</td>
                        <td className="py-3 text-slate-500">Jun, 26</td>
                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-500 border border-rose-200">
                            Low
                          </span>
                        </td>
                      </tr>

                      {/* Project 2 */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3">
                          <input type="checkbox" className="rounded text-teal-500 focus:ring-0 cursor-pointer" />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" 
                              alt="Jenifer Vintage" 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-800">Jenifer Vintage</div>
                              <div className="text-[11px] text-slate-400">Web Designer</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">Mashable</td>
                        <td className="py-3 text-slate-500">March, 31</td>
                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            High
                          </span>
                        </td>
                      </tr>

                      {/* Project 3 */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3">
                          <input type="checkbox" className="rounded text-teal-500 focus:ring-0 cursor-pointer" />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80" 
                              alt="William Jem" 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-800">William Jem</div>
                              <div className="text-[11px] text-slate-400">Developer</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">Flatable</td>
                        <td className="py-3 text-slate-500">Aug, 02</td>
                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-200">
                            medium
                          </span>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Latest Updates (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-lg shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-800">Latest Updates</h2>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    
                    {/* Update 1 */}
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] text-slate-400 w-16 shrink-0 pt-1">2 hrs ago</span>
                      <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/30">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">+ 1652 Followers</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">You're getting more and more followers, keep it up!</div>
                      </div>
                    </div>

                    {/* Update 2 */}
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] text-slate-400 w-16 shrink-0 pt-1">4 hrs ago</span>
                      <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/30">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">+ 5 New Products were added!</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Congratulations!</div>
                      </div>
                    </div>

                    {/* Update 3 */}
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] text-slate-400 w-16 shrink-0 pt-1">2 day ago</span>
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">+ 1 Friend Requests</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">This is great, keep it up!</div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer User Avatar Snippet */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80" 
                    alt="Jeny William" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-xs text-slate-800">Jeny William</div>
                    <div className="text-[11px] text-slate-400">Graphic Designer</div>
                  </div>
                </div>

              </div>

            </div>

          </main>
        </div>

      </div>
    );
  }


  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6 bg-[#0f1115] relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-2xl shadow-2xl rounded-3xl border border-white/10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="mb-10 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Acme Corp</h1>
          <p className="text-sm text-slate-400 font-medium">Secure Employee Gateway</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex animate-in slide-in-from-top-2">
              <svg className="h-5 w-5 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-300 ml-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-black/60"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-semibold text-slate-300" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-black/60"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f1115] focus:ring-indigo-500 transition-all active:scale-[0.98]"
          >
            Authenticate
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-500 tracking-wide uppercase font-semibold">
            Internal Use Only. Access is monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
