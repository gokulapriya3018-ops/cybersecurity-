import { useState } from 'react';
import { Search, ShieldAlert, ShoppingCart } from 'lucide-react';

export default function SQLi02Search() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setQueryExecuted('');
    
    try {
      const res = await fetch(`http://localhost:3000/api/sims/sqli/lab2/search?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      
      setQueryExecuted(data.query || '');
      
      if (data.ok) {
        setProducts(data.products || []);
      } else {
        setError(data.error || 'Database error occurred.');
        setProducts([]);
        if (data.error && (data.error.includes('syntax error') || data.error.includes('unterminated quoted string'))) {
           // Basic check for error injection
           setSuccess(true);
           window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="text-2xl font-black text-slate-800 tracking-tighter">ShopMart</div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Home</span>
            <span>Categories</span>
            <ShoppingCart className="w-5 h-5" />
          </div>
        </header>

        {success && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Injection Successful</h3>
              <p className="text-emerald-700 mb-2">You successfully caused a database error, revealing underlying information or bypassing constraints.</p>
              <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}ERR0R_B4S3D_M4ST3R{'}'}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Find Products</h1>
          <p className="text-slate-500 mb-8">Search our entire catalog of items.</p>
          
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by product name..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
              />
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-colors text-lg">
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-900 text-red-400 p-6 rounded-2xl font-mono text-sm overflow-x-auto shadow-inner border border-red-950 mb-8">
            <div className="text-red-300 font-bold mb-2">Uncaught DatabaseException:</div>
            {error}
          </div>
        )}

        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer">
                <div className="h-40 bg-slate-100 rounded-xl mb-4 flex items-center justify-center">
                   <div className="text-slate-300 text-4xl">📦</div>
                </div>
                <h3 className="font-bold text-slate-800 text-xl mb-1">{product.name}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="font-black text-indigo-600 text-xl">${product.price}</div>
              </div>
            ))}
          </div>
        )}

        {queryExecuted && (
          <div className="mt-12 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executed Query</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Debug</span>
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
