import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import pirateOneLogo from '@/assets/logo.svg';

const ALL_POSTERS = [
  '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  '/hek3koDUyRQk7FIhPXsa6mT2Zbo.jpg',
  '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  '/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
  '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  '/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  '/velWPhVMQeQKcxggNEU8YmIo52R.jpg',
  '/kqjL17yufvn9OVLyXYpvtyrFfak.jpg',
  '/2CAL2433ZeIihfX1Hb2139CX0pW.jpg',
  '/fOy2Jurz9k6RnJnMbVOwGKdZx2C.jpg',
  '/sv1xJUazXeYqALzczSZ3O6nkH75.jpg',
  '/qNBAXBIQlnOThrVvA6mA2B5ggkl.jpg',
  '/8kSerJrhrJWKLk1LViesGcnrVPE.jpg',
  '/gEjNlhZhyHeto6a68ooh7xDiAhO.jpg',
  '/A3ZbZsmsvNGdprRi2lKgGEeVLEH.jpg',
  '/xmbU4JTUm4GYKE56n9TXjyHbCGw.jpg',
  '/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
  '/zdjkLpDuLqFPMzJCFJZjRkz3UBm.jpg',
  '/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg',
  '/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
  '/74xTEgt7R36Fpooo50r9T25onhq.jpg',
  '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  '/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
  '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
  '/8kSerJrhrJWKLk1LViesGcnrVPE.jpg',
  '/gEjNlhZhyHeto6a68ooh7xDiAhO.jpg',
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  '/hek3koDUyRQk7FIhPXsa6mT2Zbo.jpg',
  '/kqjL17yufvn9OVLyXYpvtyrFfak.jpg',
  '/sv1xJUazXeYqALzczSZ3O6nkH75.jpg',
  '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
];

const BASE = 'https://image.tmdb.org/t/p/w342';

function makeColumns(n: number): string[][] {
  const perCol = Math.ceil(ALL_POSTERS.length / n);
  return Array.from({ length: n }, (_, ci) => {
    const start = (ci * perCol) % ALL_POSTERS.length;
    const col: string[] = [];
    for (let i = 0; i < perCol + 4; i++) {
      col.push(ALL_POSTERS[(start + i) % ALL_POSTERS.length]);
    }
    return col;
  });
}

const COLS = makeColumns(8);

interface PosterColumnProps {
  images: string[];
  reverse?: boolean;
  duration?: number;
  className?: string;
}

const PosterColumn = ({ images, reverse = false, duration = 32, className = '' }: PosterColumnProps) => {
  const doubled = [...images, ...images];
  return (
    <div
      className={`${reverse ? 'poster-col-up' : 'poster-col-down'} ${className}`}
      style={{ animationDuration: `${duration}s` }}
    >
      {doubled.map((path, i) => (
        <div key={i} className="poster-item">
          <img
            src={`${BASE}${path}`}
            alt=""
            loading="lazy"
            onError={(e) => {
              const wrapper = (e.target as HTMLImageElement).parentElement;
              if (wrapper) wrapper.style.display = 'none';
            }}
          />
        </div>
      ))}
    </div>
  );
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(() => new URLSearchParams(window.location.search).get('mode') !== 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) toast.error(error.message);
        else toast.success('Password reset email sent! Check your inbox. 📧');
        return;
      }
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast.error(error.message);
        else { toast.success('Welcome back, pirate!'); navigate('/'); }
      } else {
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        const { error } = await signUp(email, password);
        if (error) toast.error(error.message);
        else { toast.success('Welcome aboard! 🏴‍☠️'); navigate('/'); }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes scrollDown {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
        @keyframes scrollUp {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        .poster-col-down { animation: scrollDown linear infinite; }
        .poster-col-up   { animation: scrollUp  linear infinite; }

        .poster-col-down,
        .poster-col-up {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .poster-item {
          width: 100%;
          aspect-ratio: 2 / 3;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: #111;
        }
        .poster-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.6;
          display: block;
          transition: opacity 0.4s;
        }
        .poster-item:hover img { opacity: 0.85; }

        @media (max-width: 480px)  { .hide-xs { display: none !important; } }
        @media (max-width: 768px)  { .hide-sm { display: none !important; } }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu1 { animation: fadeUp 0.55s 0.05s ease both; }
        .fu2 { animation: fadeUp 0.55s 0.15s ease both; }
        .fu3 { animation: fadeUp 0.55s 0.25s ease both; }
        .fu4 { animation: fadeUp 0.55s 0.35s ease both; }

        .auth-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.28); }
        .auth-input:focus {
          border-color: rgba(255,255,255,0.32);
          background: rgba(255,255,255,0.09);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
        }
        .auth-input-pr { padding-right: 44px; }

        .submit-btn {
          width: 100%;
          height: 50px;
          border-radius: 10px;
          background: #fff;
          color: #0a0a0a;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .submit-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.88);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.5);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .tab-bar {
          display: flex;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 28px;
        }
        .tab-btn {
          flex: 1;
          padding: 9px 0;
          border-radius: 7px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }
        .tab-active {
          background: rgba(255,255,255,0.13);
          color: #fff;
          border-color: rgba(255,255,255,0.13);
        }
        .tab-inactive {
          background: transparent;
          color: rgba(255,255,255,0.38);
        }
        .tab-inactive:hover { color: rgba(255,255,255,0.65); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
      `}</style>

      <div style={{ position: 'relative', minHeight: '100vh', background: '#080808', overflow: 'hidden', display: 'flex' }}>

        {/* POSTER BACKGROUND */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', gap: '8px', padding: '8px',
          overflow: 'hidden',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          <PosterColumn images={COLS[0]} duration={30} />
          <PosterColumn images={COLS[1]} reverse duration={36} />
          <PosterColumn images={COLS[2]} duration={28} />
          <PosterColumn images={COLS[3]} reverse duration={34} className="hide-xs" />
          <PosterColumn images={COLS[4]} duration={32} className="hide-xs" />
          <PosterColumn images={COLS[5]} reverse duration={38} className="hide-sm" />
          <PosterColumn images={COLS[6]} duration={29} className="hide-sm" />
          <PosterColumn images={COLS[7]} reverse duration={35} className="hide-sm" />

          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #080808 0%, transparent 18%, transparent 82%, #080808 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #080808 0%, transparent 12%, transparent 88%, #080808 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 70% at 50% 50%, rgba(8,8,8,0.72) 0%, transparent 100%)' }} />
        </div>

        {/* Grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }} />

        {/* FORM */}
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '64px 16px',
        }}>
          {/* Logo */}
          <div className="fu1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
            <img src={pirateOneLogo} alt="PirateOne" style={{ height: '40px', objectFit: 'contain', marginBottom: '10px' }} />
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)' }}>
              Your streaming haven
            </p>
          </div>

          {/* Panel */}
          <div className="fu2" style={{
            width: '100%', maxWidth: '480px',
            background: 'rgba(14,14,14,0.88)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '18px',
            padding: '40px 36px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.75)',
            boxSizing: 'border-box',
          }}>
            {/* Tabs */}
            {!isForgotPassword && (
              <div className="fu2 tab-bar">
                {['Sign In', 'Sign Up'].map((tab) => {
                  const active = (tab === 'Sign In') === isLogin;
                  return (
                    <button key={tab} onClick={() => setIsLogin(tab === 'Sign In')} className={`tab-btn ${active ? 'tab-active' : 'tab-inactive'}`}>
                      {tab}
                    </button>
                  );
                })}
              </div>
            )}

            {isForgotPassword && (
              <button onClick={() => setIsForgotPassword(false)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'0.8rem', cursor:'pointer', padding:0, marginBottom:'20px' }}>
                <ArrowLeft size={14}/> Back to sign in
              </button>
            )}

            {/* Heading */}
            <div className="fu3" style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: '6px' }}>
                {isForgotPassword ? 'Reset password' : isLogin ? 'Welcome back' : 'Join the crew'}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.38)' }}>
                {isForgotPassword ? "Enter your email and we'll send you a reset link" : isLogin ? 'Sign in to continue watching' : 'Create your account to get started'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="fu4">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', marginBottom: '8px' }}>
                  Email
                </label>
                <input type="email" placeholder="pirate@sea.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
              </div>

              {!isForgotPassword && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', marginBottom: '8px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input auth-input-pr" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.32)', padding: 0, display: 'flex', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.32)')}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!isLogin && <p style={{ marginTop: '6px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.28)' }}>Minimum 6 characters</p>}
                  {isLogin && (
                    <button type="button" onClick={() => setIsForgotPassword(true)}
                      style={{ marginTop:'8px', background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', cursor:'pointer', padding:0, transition:'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <><span className="spinner" />{isForgotPassword ? 'Sending…' : isLogin ? 'Signing in…' : 'Creating account…'}</>
                ) : (
                  <>{isForgotPassword ? '📧' : isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}{isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}</>
                )}
              </button>
            </form>

            {/* Toggle */}
            {!isForgotPassword && (
              <p style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.32)' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s', padding: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            )}
          </div>

          {/* Footer */}
          <p style={{ marginTop: '28px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' }}>
            Stream freely. No ads. No limits.
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
