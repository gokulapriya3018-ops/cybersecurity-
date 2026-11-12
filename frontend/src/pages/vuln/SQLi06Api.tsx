import { useState, useEffect } from 'react';
import { ShieldAlert, Server, Code, Terminal } from 'lucide-react';

export default function SQLi06Api() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('ui');

  const fetchApi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setQueryExecuted('');
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab6/api-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search })
      });
      const responseData = await res.json();
      
      setQueryExecuted(responseData.query || '');
      
      if (responseData.ok) {
        setData(responseData.data || []);
        if (responseData.injected) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(responseData.error || 'API Error');
        setData([]);
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  useEffect(() => {
    fetchApi();
  }, []);

  return (
    <div className="min-h-full bg-[#0d1117] text-[#c9d1d9] font-sans p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#30363d]">
          <Server className="w-6 h-6 text-[#58a6ff]" />
          <h1 className="text-2xl font-semibold">API Endpoint Testing</h1>
        </div>

        {success && (
          <div className="mb-8 p-4 bg-[rgba(46,160,67,0.15)] border border-[rgba(46,160,67,0.4)] rounded-md flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-[#3fb950] shrink-0 mt-1" />
            <div>
              <h3 className="text-base font-bold text-[#3fb950] mb-1">API Injection Successful</h3>
              <p className="text-sm mb-2">You successfully injected a payload via the JSON body.</p>
              <p className="text-xs font-mono text-[#58a6ff]">Flag: CSA{'{'}JSON_4P1_Byp4ss{'}'}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
              <div className="bg-[#0d1117] border-b border-[#30363d] px-4 py-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-[#8b949e]" />
                <span className="text-sm font-semibold text-[#8b949e]">Request Payload</span>
              </div>
              <div className="p-4">
                <form onSubmit={fetchApi}>
                  <div className="mb-4">
                    <label className="block text-xs font-mono text-[#8b949e] mb-2">POST /api/search</label>
                    <textarea 
                      value={`{\n  "search": "${search}"\n}`}
                      readOnly
                      className="w-full bg-[#010409] border border-[#30363d] rounded p-3 font-mono text-sm text-[#58a6ff] h-24 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#8b949e] mb-2">Inject Value here:</label>
                    <input 
                      type="text" 
                      value={search}
                      onChange={e => {
                        const val = e.target.value;
                        if (/['"=#;]/.test(val)) {
                          alert('Client-Side Security: Invalid characters detected. Please use alphanumeric characters only.');
                          return;
                        }
                        setSearch(val);
                      }}
                      className="w-full bg-[#010409] border border-[#30363d] rounded px-3 py-2 text-sm text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none transition-colors"
                      placeholder="Search term"
                    />
                  </div>
                  <button type="submit" className="mt-4 w-full bg-[#238636] hover:bg-[#2ea043] text-white font-semibold py-2 px-4 rounded text-sm transition-colors border border-[rgba(240,246,252,0.1)]">
                    Send Request
                  </button>
                </form>
              </div>
            </div>

            {queryExecuted && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
                <div className="bg-[#0d1117] border-b border-[#30363d] px-4 py-2 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#8b949e]" />
                  <span className="text-sm font-semibold text-[#8b949e]">Backend SQL Query</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <code className="text-[#ff7b72] text-xs whitespace-pre-wrap font-mono">
                    {queryExecuted}
                  </code>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden flex flex-col">
            <div className="bg-[#0d1117] border-b border-[#30363d] flex">
              <button 
                onClick={() => setActiveTab('ui')}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'ui' ? 'border-b-2 border-[#f78166] text-[#c9d1d9]' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}
              >
                Rendered Data
              </button>
              <button 
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'json' ? 'border-b-2 border-[#f78166] text-[#c9d1d9]' : 'text-[#8b949e] hover:text-[#c9d1d9]'}`}
              >
                Raw JSON
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-[#010409]">
              {error ? (
                <div className="text-[#f85149] font-mono text-sm">
                  {`{ "error": "${error}" }`}
                </div>
              ) : activeTab === 'json' ? (
                <pre className="text-[#a5d6ff] font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              ) : (
                <div className="space-y-4">
                  {data.length === 0 && <div className="text-sm text-[#8b949e]">No results.</div>}
                  {data.map((item, i) => (
                    <div key={i} className="border border-[#30363d] rounded p-3 bg-[#161b22]">
                      <div className="font-bold text-[#c9d1d9] mb-1">{item.name}</div>
                      <div className="text-xs text-[#8b949e]">{item.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
