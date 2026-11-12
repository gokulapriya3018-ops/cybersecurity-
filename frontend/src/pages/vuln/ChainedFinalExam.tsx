import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  ShoppingCart, 
  User, 
  Heart, 
  Check, 
  X, 
  MessageSquare, 
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Lock,
  Receipt,
  Tag,
  ArrowRight,
  ShieldAlert,
  Zap,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MasterCertificateModal } from '../../components/certificate/MasterCertificateModal';

interface Product {
  id: number;
  name: string;
  category: string;
  price: string | number;
  original_price: string | number;
  description: string;
  image_url: string;
  rating: string | number;
}

interface Review {
  id: number;
  product_id: number;
  author: string;
  rating: number;
  headline: string;
  content: string;
  created_at: string;
}

interface UserProfile {
  username: string;
  role: string;
  email: string;
  apiKey?: string;
}

export default function ChainedFinalExam() {
  // Progression Lock State (Must complete all 20 labs to unlock)
  const [isLocked, setIsLocked] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [sqliCount, setSqliCount] = useState(0);
  const [xssCount, setXssCount] = useState(0);
  const [adminOverride, setAdminOverride] = useState(false);

  // Storefront & Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // User Authentication state (Loophole 1: SQLi Auth Bypass)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Cart & Promo Code state (Loophole 3: Promo SQLi & Price Tampering)
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<any | null>(null);

  // Product Reviews Modal (Loophole 2: Stored XSS sink)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewHeadline, setReviewHeadline] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Lab solve state
  const [hasSolved, setHasSolved] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    checkPrerequisites();
    fetchProducts('', 'All');

    (window as any).__csa_update_price = async (productId: number = 2, price: number = 1.00) => {
      try {
        await fetch('http://localhost:3000/api/sims/chained/update-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId, price })
        });
        fetchProducts(searchQuery, selectedCategory);
      } catch (e) {}
    };

    return () => {
      delete (window as any).__csa_update_price;
    };
  }, []);

  const checkPrerequisites = async () => {
    const token = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');
    let currentUserData = null;
    try {
      if (storedUserStr) currentUserData = JSON.parse(storedUserStr);
    } catch (e) {}

    // Admin accounts unlock automatically
    if (currentUserData?.role === 'ADMIN') {
      setIsLocked(false);
      return;
    }

    if (token) {
      try {
        const res = await fetch('http://localhost:3000/api/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.progress)) {
          const completedLabs = data.progress.filter((p: any) => p.completed && p.lab?.slug);
          const sqli = completedLabs.filter((p: any) => p.lab.slug.startsWith('sqli')).length;
          const xss = completedLabs.filter((p: any) => p.lab.slug.startsWith('xss')).length;
          const total = sqli + xss;

          setCompletedCount(total);
          setSqliCount(sqli);
          setXssCount(xss);

          // Check if master lab was already solved
          const isMasterDone = data.progress.some((p: any) => p.lab?.slug === 'chained-final-exam' && p.completed);
          if (isMasterDone) {
            setHasSolved(true);
          }

          // Requires all 20 labs to unlock
          if (total >= 20) {
            setIsLocked(false);
          } else {
            setIsLocked(true);
          }
        }
      } catch (e) {
        setIsLocked(false); // Graceful fallback
      }
    }
  };

  const triggerSolve = () => {
    if (hasSolved) return;
    setHasSolved(true);
    setShowCertificate(true);
    window.dispatchEvent(new CustomEvent('lab-solved'));
  };

  const fetchProducts = async (search: string, category: string) => {
    setLoading(true);
    try {
      const url = `http://localhost:3000/api/sims/chained/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok && Array.isArray(data.products)) {
        setProducts(data.products);
        const laptop = data.products.find((p: Product) => p.id === 2);
        if (laptop && Number(laptop.price) <= 10.00) {
          triggerSolve();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Loophole 1: Account Login Submission (Vulnerable to SQL Injection Auth Bypass)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/sims/chained/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await res.json();

      if (data.ok && data.user) {
        setUser(data.user);
        setShowAuthModal(false);
        setAuthUsername('');
        setAuthPassword('');
      } else {
        setAuthError(data.error || 'Invalid username or password. Please try again.');
      }
    } catch (err: any) {
      setAuthError('Connection error to account authentication gateway.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Loophole: Apply Promo Code (Vulnerable to SQL Injection)
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/api/sims/chained/apply-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput })
      });
      const data = await res.json();

      if (data.ok && data.coupon) {
        setAppliedPromo(data.coupon);
        setPromoInput('');
        if (data.injected || data.coupon.discountPercent >= 100) {
          triggerSolve();
        }
      } else {
        setPromoError(data.error || 'Invalid promotional voucher code.');
      }
    } catch (e) {
      setPromoError('Promo server communication failure.');
    }
  };

  // Loophole 2: Submit Customer Review (Vulnerable to Stored XSS)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewContent.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/api/sims/chained/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          author: reviewAuthor || (user ? user.username : 'Customer'),
          rating: reviewRating,
          headline: reviewHeadline || 'Product Review',
          content: reviewContent
        })
      });
      const data = await res.json();
      if (data.ok) {
        setReviewSubmitted(true);
        setReviewContent('');
        setReviewHeadline('');
        setReviewAuthor('');
        fetchReviews(selectedProduct.id);

        if (reviewContent.includes('<img') || reviewContent.includes('<script')) {
          triggerSolve();
          // Trigger price reduction
          fetch('http://localhost:3000/api/sims/chained/update-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 2, price: 1.00 })
          }).then(() => fetchProducts(searchQuery, selectedCategory));
        }
      }
    } catch (e) {}
  };

  const fetchReviews = async (productId: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/sims/chained/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (e) {}
  };

  const openProductReviews = (product: Product) => {
    setSelectedProduct(product);
    setReviewSubmitted(false);
    fetchReviews(product.id);
  };

  const handleAddToCart = (item: Product) => {
    setCartItems(prev => [...prev, item]);
    setCartToast(`Added "${item.name}" to cart.`);
    setTimeout(() => setCartToast(null), 3000);
  };

  const handleCheckout = async () => {
    try {
      const discount = appliedPromo ? appliedPromo.discountPercent : 0;
      const res = await fetch('http://localhost:3000/api/sims/chained/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems, appliedDiscount: discount })
      });
      const data = await res.json();
      if (data.ok) {
        setOrderReceipt({
          orderId: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toLocaleDateString(),
          items: [...cartItems],
          total: data.totalCharged,
          isHacked: data.solved
        });
        if (data.solved) {
          triggerSolve();
        }
        setCartItems([]);
      }
    } catch (e) {}
  };

  const categories = ['All', 'Audio', 'Laptops', 'Keyboards', 'Monitors', 'Smartwatch', 'Security'];
  const rawSubtotal = cartItems.reduce((acc, curr) => acc + (parseFloat(curr.price as string) || 0), 0);
  const discountAmount = appliedPromo ? (rawSubtotal * appliedPromo.discountPercent) / 100 : 0;
  const finalCartTotal = Math.max(0, rawSubtotal - discountAmount);

  // ─────────────────────────────────────────────────────────────
  // GATING VIEW: LOCKED UNTIL ALL 20 LABS ARE COMPLETED
  // ─────────────────────────────────────────────────────────────
  if (isLocked && !adminOverride) {
    const progressPercent = Math.round((completedCount / 20) * 100);

    return (
      <div className="min-h-screen bg-[#0A0D14] text-slate-100 font-sans flex flex-col justify-between p-6">
        
        {/* Header */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between pt-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white uppercase">CyberForge Terminal</span>
              <p className="text-[10px] text-slate-500 font-mono">Curriculum Progression Gate</p>
            </div>
          </div>
          <Link to="/" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">
            ← Return to Dashboard
          </Link>
        </div>

        {/* Locked Center Box */}
        <div className="max-w-xl w-full mx-auto py-12">
          <div className="bg-[#101422] border border-amber-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-widest">
                Clearance Gate: Capstone Master Exam
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Master Lab Locked
              </h1>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Prerequisite Requirement: You must complete all <strong>20 curriculum sandboxes</strong> (10 SQL Injection + 10 Cross-Site Scripting) to earn clearance for this live exploit exam.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="p-5 rounded-2xl bg-black/40 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Curriculum Clearance:</span>
                <span className="font-bold text-amber-400">{completedCount} / 20 Labs ({progressPercent}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700 shadow-md"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">SQLi Track:</span>
                  <span className="text-indigo-400 font-bold">{sqliCount} / 10</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">XSS Track:</span>
                  <span className="text-violet-400 font-bold">{xssCount} / 10</span>
                </div>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/labs/sql-injection"
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Continue SQLi Track</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/labs/xss"
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Continue XSS Track</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Instructor Override for Testing / Preview */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={() => setAdminOverride(true)}
                className="text-[11px] font-mono text-slate-500 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Instructor / Evaluation Override (Unlock Preview)</span>
              </button>
            </div>

          </div>
        </div>

        <div className="text-center text-xs text-slate-600 font-mono pb-4">
          CyberForge SOC Progression Engine • Enforcement Policy Active
        </div>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // UNLOCKED VIEW: THE REAL-TIME E-COMMERCE TARGET (WITH PROMO CODE)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      
      {/* Top Utility Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span>✨ Free Worldwide Express Shipping on Orders Over $75</span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline">30-Day Hassle-Free Returns</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white cursor-pointer transition-colors">Store Locator</span>
            <span className="hover:text-white cursor-pointer transition-colors">Track Order</span>
            <span className="hover:text-white cursor-pointer transition-colors">USD ($)</span>
          </div>
        </div>
      </div>

      {/* Main Storefront Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setSearchQuery(''); fetchProducts('', 'All'); }}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">Nexus<span className="text-indigo-600">Store</span></span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Consumer Electronics & Hardware</p>
            </div>
          </div>

          {/* Search Bar (Loophole: SQL Injection) */}
          <form onSubmit={(e) => { e.preventDefault(); fetchProducts(searchQuery, selectedCategory); }} className="flex-1 max-w-2xl relative hidden sm:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search laptops, headphones, monitors, hardware keys..."
              className="w-full pl-11 pr-24 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Search
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4">
            
            {/* Account / Sign In (Loophole 1: SQLi Auth Bypass) */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">{user.username}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">{user.role}</span>
                </div>
                <button 
                  onClick={() => setUser(null)}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors p-2"
                  title="Sign Out"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}

            <button className="relative p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-all">
              <Heart className="w-5 h-5" />
            </button>

            {/* Certificate Button (Available once Master Lab is solved) */}
            {hasSolved && (
              <button
                onClick={() => setShowCertificate(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition-all hover:scale-105"
                title="View Official Master Certificate"
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Certificate</span>
              </button>
            )}

            {/* Shopping Cart Drawer */}
            <button 
              onClick={() => setShowCartDrawer(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart ({cartItems.length})</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Strip */}
        <div className="border-t border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  fetchProducts(searchQuery, cat);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Cart Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{cartToast}</span>
        </div>
      )}

      {/* Hero Promotional Banner */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-14 shadow-xl">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              2026 Hardware Showcase
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Sound Perfected. Vision Unleashed.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Explore professional-grade acoustics, 4K OLED displays, and ultra-durable tactile hardware tailored for creators and technologists.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <strong className="block text-slate-900 font-bold">Fast Delivery</strong>
              <span>Dispatched within 24 hours</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <strong className="block text-slate-900 font-bold">2-Year Warranty</strong>
              <span>Full manufacturer guarantee</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <strong className="block text-slate-900 font-bold">30-Day Returns</strong>
              <span>Hassle-free instant refunds</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <strong className="block text-slate-900 font-bold">24/7 Support</strong>
              <span>Live expert assistance</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {searchQuery ? `Search Results for "${searchQuery}"` : `${selectedCategory} Products`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{products.length} products available</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm font-medium">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item) => {
              const isPriceHacked = Number(item.price) <= 10.00 && item.id === 2;
              return (
                <div 
                  key={item.id}
                  className={`bg-white rounded-3xl border transition-all duration-300 group flex flex-col overflow-hidden ${
                    isPriceHacked 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl' 
                      : 'border-slate-200 hover:shadow-xl shadow-sm'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold shadow-sm">
                      {item.category}
                    </span>

                    {isPriceHacked && (
                      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                        🔥 99.9% PRICE GLITCH
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-500 mb-2">
                        <div className="flex items-center">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <span className="font-bold text-slate-800">{item.rating || '4.9'}</span>
                        <span className="text-slate-400">• Verified</span>
                      </div>

                      <h3 
                        className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors"
                        dangerouslySetInnerHTML={{ __html: item.name }}
                      />

                      <p 
                        className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {item.original_price && (
                          <span className="text-xs text-slate-400 line-through block font-mono">
                            ${Number(item.original_price).toFixed(2)}
                          </span>
                        )}
                        <p className={`text-xl font-black font-mono ${isPriceHacked ? 'text-emerald-600' : 'text-slate-900'}`}>
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Customer Reviews icon (Loophole 2) */}
                        <button
                          onClick={() => openProductReviews(item)}
                          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                          title="Customer Reviews"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleAddToCart(item)}
                          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Loophole 1: Account Login Modal (Vulnerable to SQLi Auth Bypass) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">NexusStore Account Access</h3>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Username / Email</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
              >
                {authLoading ? 'Verifying Credentials...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Loophole 2: Product Customer Reviews Modal (Stored XSS sink) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500">Customer Feedback & Verified Ratings</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Write a Customer Review</h4>
                
                {reviewSubmitted && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Your review was published successfully. Thank you for your feedback!</span>
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        placeholder="e.g. Alex Henderson"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Star Rating</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                        <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                        <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                        <option value={2}>★★☆☆☆ (2 Stars - Below Average)</option>
                        <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Review Headline</label>
                    <input
                      type="text"
                      required
                      value={reviewHeadline}
                      onChange={(e) => setReviewHeadline(e.target.value)}
                      placeholder="e.g. Great build quality and performance"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Detailed Review Comments</label>
                    <textarea
                      rows={3}
                      required
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Share your personal experience with this product..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Post Customer Review
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Customer Reviews ({reviews.length})</h4>
                
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {rev.author?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900">{rev.author}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold ml-2">✓ Verified Buyer</span>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-500 text-xs">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>

                    <h5 className="font-bold text-xs text-slate-800">{rev.headline}</h5>
                    
                    <div 
                      className="text-xs text-slate-600 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: rev.content }}
                    />
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Slide-Over Drawer (With Promo Code SQLi Loophole) */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <span>Shopping Cart ({cartItems.length})</span>
              </h3>
              <button 
                onClick={() => {
                  setShowCartDrawer(false);
                  setOrderReceipt(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 py-6 space-y-4 overflow-y-auto">
              {orderReceipt ? (
                /* Verified Order Receipt */
                <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Transaction Confirmed</span>
                    <h4 className="text-lg font-black text-white mt-1">Order Placed Successfully</h4>
                    <p className="text-xs text-slate-400 font-mono">{orderReceipt.orderId}</p>
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-2 text-xs font-mono">
                    {orderReceipt.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span className="truncate max-w-[200px]">{it.name}</span>
                        <span className="text-white font-bold">${Number(it.price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                      <span>Total Charged:</span>
                      <span className="text-emerald-400">${Number(orderReceipt.total).toFixed(2)}</span>
                    </div>
                  </div>

                  {orderReceipt.isHacked && (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                        🏆 <strong>BUSINESS LOGIC BREACH CONFIRMED:</strong> Hardware acquired at tampered valuation / free order override!
                      </div>
                      <button
                        onClick={() => setShowCertificate(true)}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02]"
                      >
                        <Award className="w-4 h-4" />
                        <span>Claim Master Completion Certificate</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Your cart is empty. Add products from the catalog to proceed.
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <img 
                        src={item.image_url} 
                        alt="" 
                        className="w-16 h-16 rounded-xl object-cover shrink-0" 
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                        <p className="font-black text-xs text-slate-900 mt-1 font-mono">${Number(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Promo Code Input (Vulnerable to SQL Injection) */}
                  <div className="pt-4 border-t border-slate-200">
                    <form onSubmit={handleApplyPromo} className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Promotional Voucher Code</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="e.g. NEXUS10"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    </form>

                    {promoError && (
                      <p className="text-xs text-rose-600 font-mono mt-1.5">{promoError}</p>
                    )}

                    {appliedPromo && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between">
                        <div>
                          <strong className="block font-bold">{appliedPromo.code}: {appliedPromo.discountPercent}% OFF</strong>
                          <span className="text-[10px] text-emerald-700">{appliedPromo.description}</span>
                        </div>
                        <button onClick={() => setAppliedPromo(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {cartItems.length > 0 && !orderReceipt && (
              <div className="pt-4 border-t border-slate-200 space-y-3 font-mono">
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-slate-900">${rawSubtotal.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount ({appliedPromo.discountPercent}%):</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-base font-black text-slate-900">
                    <span>Final Total:</span>
                    <span className={discountAmount >= rawSubtotal ? 'text-emerald-600' : 'text-slate-900'}>
                      ${finalCartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all font-sans"
                >
                  Confirm & Complete Purchase
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Store Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900">NexusStore</span>
            <span>• Consumer Hardware Platform</span>
          </div>
          <div>© 2026 NexusStore Technologies Inc. All rights reserved.</div>
        </div>
      </footer>

      {/* Official Master Certificate Modal */}
      {showCertificate && (
        <MasterCertificateModal
          onClose={() => setShowCertificate(false)}
          studentName={user?.username || undefined}
        />
      )}

    </div>
  );
}
