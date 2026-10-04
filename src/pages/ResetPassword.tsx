import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import pirateOneLogo from '@/assets/logo.svg';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    // Also check hash
    if (window.location.hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully! 🎉');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <div style={{ textAlign:'center', maxWidth:'400px' }}>
          <img src={pirateOneLogo} alt="PirateOne" style={{ height:'36px', marginBottom:'24px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.4rem', fontWeight:700, marginBottom:'12px' }}>Invalid Reset Link</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem', marginBottom:'24px' }}>This link is invalid or has expired. Please request a new password reset.</p>
          <button onClick={() => navigate('/auth')} style={{ padding:'12px 28px', borderRadius:'10px', background:'#fff', color:'#0a0a0a', fontWeight:700, border:'none', cursor:'pointer', fontSize:'0.9rem' }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:'420px', background:'rgba(14,14,14,0.88)', backdropFilter:'blur(28px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'18px', padding:'40px 36px' }}>
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <img src={pirateOneLogo} alt="PirateOne" style={{ height:'36px', marginBottom:'12px' }} />
          <h1 style={{ color:'#fff', fontSize:'1.5rem', fontWeight:700, marginBottom:'6px' }}>Set New Password</h1>
          <p style={{ color:'rgba(255,255,255,0.38)', fontSize:'0.875rem' }}>Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.42)', marginBottom:'8px' }}>New Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPassword?'text':'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width:'100%', height:48, padding:'0 44px 0 16px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.32)', padding:0, display:'flex' }}>
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <div style={{ marginBottom:'24px' }}>
            <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.42)', marginBottom:'8px' }}>Confirm Password</label>
            <input type={showPassword?'text':'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              style={{ width:'100%', height:48, padding:'0 16px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
            <p style={{ marginTop:'6px', fontSize:'0.75rem', color:'rgba(255,255,255,0.28)' }}>Minimum 6 characters</p>
          </div>

          <button type="submit" disabled={loading}
            style={{ width:'100%', height:50, borderRadius:10, background:'#fff', color:'#0a0a0a', fontSize:'0.9rem', fontWeight:700, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: loading ? 0.45 : 1 }}>
            {loading ? 'Updating…' : <><KeyRound size={16}/> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
