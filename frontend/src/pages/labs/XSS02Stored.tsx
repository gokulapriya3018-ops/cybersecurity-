import { useState, useEffect, useRef } from 'react';
import { Send, Terminal, CheckCircle, RotateCcw } from 'lucide-react';

export default function XSS02Stored() {
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const authToken = localStorage.getItem('token');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for XSS completion message
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.data?.type === 'xss-complete' || 
        event.data === 'xss-complete' ||
        (typeof event.data === 'string' && event.data.includes('xss-complete'))
      ) {
        setSuccess(true);
        window.dispatchEvent(new CustomEvent('lab-solved'));

        if (authToken) {
          try {
            await fetch('http://localhost:3000/api/progress/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ labSlug: 'xss-stored' })
            });
          } catch (err) {
            console.error(err);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authToken]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/sims/xss/lab2/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: comment })
      });
      const data = await res.json();
      if (data.ok) {
        setComment('');
        // Reload iframe to render the new stored comments and trigger XSS
        setIframeKey(prev => prev + 1);
      } else {
        setError(data.message || 'Failed to submit comment.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  const handleReset = async () => {
    try {
      await fetch('http://localhost:3000/api/sims/xss/lab2/reset', { method: 'POST' });
      setIframeKey(prev => prev + 1);
    } catch (err) {
      setError('Failed to clear comments.');
    }
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lab Panel (Left) */}
        <div className="space-y-6">
          <header className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lab 2: Stored XSS</h1>
            <p className="text-sm text-slate-500 mt-1">Difficulty: Beginner • Stored database guestbook comments</p>
          </header>

          {success && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm animate-in zoom-in duration-300">
              <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-1">XSS Execution Successful!</h3>
                <p className="text-emerald-700 mb-2">Your stored payload successfully executed in the database context and triggered the verification callback.</p>
                <p className="text-xs font-mono text-emerald-600 bg-emerald-100/60 px-2 py-1 rounded inline-block">Flag: CSA{'{'}ST0R3D_XSS_M4ST3R{'}'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Submit Guestbook Comment</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Enter guestbook comment..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                required
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Post Comment
                </button>
                <button 
                  type="button" 
                  onClick={handleReset} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors flex items-center gap-1.5"
                  title="Clear all stored comments from database"
                >
                  <RotateCcw className="w-4 h-4" /> Clear Comments
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Iframe View (Right) */}
        <div className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden min-h-[450px]">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 font-mono">Sandbox Browser Iframe Context</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded ml-auto">VULNERABLE</span>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src="http://localhost:3000/api/sims/xss/lab2/view"
              className="w-full h-full border-none absolute inset-0"
              title="Vulnerable Stored XSS Sandbox"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
