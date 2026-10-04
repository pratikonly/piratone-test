import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { useToast } from '@/hooks/use-toast';
import {
  Star, Send, HelpCircle, Lightbulb, CheckCircle, XCircle,
  Sparkles, Shield, Database, Server, Download, Zap,
  ChevronDown, ChevronUp, Anchor, Tv, Film,
  BookMarked, History, Library, User, Camera, Search, TrendingUp,
  Award, ThumbsUp, MessageSquare, Hash, Keyboard, MonitorPlay,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || '';

/* ─── Section label ─── */
const SL = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'18px' }}>
    <span style={{ color:'rgba(255,255,255,0.28)', display:'flex' }}>{icon}</span>
    <span style={{ fontSize:'0.63rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.28)' }}>{label}</span>
    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)', marginLeft:'6px' }} />
  </div>
);

const Help = () => {
  const { toast } = useToast();
  const [rating, setRating]             = useState(0);
  const [hoverRating, setHoverRating]   = useState(0);
  const [feedback, setFeedback]         = useState('');
  const [email, setEmail]               = useState('');
  const [name, setName]                 = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq]           = useState<number | null>(null);

  const submit = async () => {
    if (!rating)          { toast({ title:'Rating Required',   variant:'destructive' }); return; }
    if (!feedback.trim()) { toast({ title:'Feedback Required', variant:'destructive' }); return; }
    if (!email.trim())    { toast({ title:'Email Required',    variant:'destructive' }); return; }
    setIsSubmitting(true);
    const saveLocal = () => {
      try {
        const s = JSON.parse(localStorage.getItem('pirateone_feedback')||'[]');
        s.push({ name:name||'Anonymous', rating, feedback:feedback.trim(), email:email.trim(), createdAt:new Date().toISOString() });
        localStorage.setItem('pirateone_feedback', JSON.stringify(s));
      } catch {}
      setRating(0); setFeedback(''); setEmail(''); setName('');
    };
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
          { from_name:name||'Anonymous', from_email:email, rating:`${rating}/5`, message:feedback, to_name:'PirateOne Team' },
          EMAILJS_PUBLIC_KEY);
        toast({ title:'Thank You!', description:'Feedback sent!' });
        setRating(0); setFeedback(''); setEmail(''); setName('');
      } catch { saveLocal(); toast({ title:'Saved locally', description:'Could not send email.' }); }
    } else { saveLocal(); toast({ title:'Thank You!' }); }
    setIsSubmitting(false);
  };

  const faqs = [
    { q:'Why do I need to click twice on the video player?',  a:'The first click activates the player and our ad protection layer. The second click performs your intended action. This is by design to block ad redirects.' },
    { q:'Why is nothing loading on the website?',             a:"If content isn't loading, try using a VPN. Some content may be geo-restricted in your region." },
    { q:'How do I add movies to my watchlist?',               a:'Click on any movie or series, then click the bookmark icon. You can access your watchlist from the sidebar.' },
    { q:'Why is the video quality low?',                      a:'Video quality depends on the source and your connection. Try switching to a different server on the watch page.' },
    { q:'Can I download movies for offline viewing?',         a:'Yes! Use the Download button on the watch page. Quality options are available before downloading.' },
    { q:'Is my watchlist saved across devices?',              a:'If you sign in, your watchlist syncs to the cloud. As a guest, data is stored locally in your browser only.' },
  ];

  const tips = [
    'Click once to activate the player, then click again to play/pause',
    "Use a VPN if content doesn't load in your region",
    "Try switching servers if one doesn't work — each has different content availability",
    'Check your internet connection if videos buffer frequently',
    'Sign in to sync your watchlist and library across devices',
  ];

  const featureGroups = [
    {
      label:'Streaming', color:'text-primary', ib:'bg-primary/10', ibr:'border-primary/20', ic:'text-primary',
      features:[
        { icon:<Film className="w-4 h-4"/>,    name:'Movies Streaming',    desc:'Thousands of movies in HD quality' },
        { icon:<Tv className="w-4 h-4"/>,       name:'TV Series Streaming', desc:'Complete series with all seasons & episodes' },
        { icon:<Sparkles className="w-4 h-4"/>, name:'Anime Streaming',     desc:'Subbed & dubbed options available' },
        { icon:<Zap className="w-4 h-4"/>,      name:'HD Quality',          desc:'Stream up to 1080p HD' },
        { icon:<Film className="w-4 h-4"/>,     name:'Trailer Previews',    desc:'Watch official trailers before streaming' },
      ],
    },
    {
      label:'Privacy & Security', color:'text-emerald-400', ib:'bg-emerald-500/10', ibr:'border-emerald-500/20', ic:'text-emerald-400',
      features:[
        { icon:<Shield className="w-4 h-4"/>,   name:'Ad Redirect Blocking',          desc:'Blocks popups & new-tab redirects automatically' },
        { icon:<Database className="w-4 h-4"/>, name:'Data Stored Securely',           desc:'Encrypted & private — no tracking, no data sold' },
        { icon:<User className="w-4 h-4"/>,     name:'Browse Without or With Account', desc:'Guest or signed-in — your choice' },
      ],
    },
    {
      label:'User Features', color:'text-blue-400', ib:'bg-blue-500/10', ibr:'border-blue-500/20', ic:'text-blue-400',
      features:[
        { icon:<History className="w-4 h-4"/>,   name:'Watch History',   desc:'Track watched content, syncs to cloud when signed in' },
        { icon:<BookMarked className="w-4 h-4"/>, name:'Watchlist',       desc:'Save movies & shows to watch later' },
        { icon:<Library className="w-4 h-4"/>,   name:'Library Tracking', desc:'Mark as Watching, Completed, or Dropped' },
        { icon:<Anchor className="w-4 h-4"/>,    name:'Pirate Identity', desc:'Fun randomized pirate persona — regenerate anytime' },
        { icon:<Camera className="w-4 h-4"/>,    name:'Profile Picture', desc:'Upload your own profile picture from Settings' },
      ],
    },
    {
      label:'Discovery', color:'text-purple-400', ib:'bg-purple-500/10', ibr:'border-purple-500/20', ic:'text-purple-400',
      features:[
        { icon:<Search className="w-4 h-4"/>,       name:'Search',             desc:'Find any movie, TV show, or anime by title or TMDB ID' },
        { icon:<Hash className="w-4 h-4"/>,          name:'TMDB ID Lookup',     desc:'Jump directly to any title by entering its TMDB ID (e.g. movie:550 or tv:1396)' },
        { icon:<TrendingUp className="w-4 h-4"/>,   name:'Trending Content',   desc:"Discover what's hot this week" },
        { icon:<Award className="w-4 h-4"/>,         name:'Top Rated & Popular', desc:'Browse highest rated and most popular titles' },
        { icon:<ThumbsUp className="w-4 h-4"/>,     name:'Recommendations',    desc:'Similar content suggestions on every watch page' },
        { icon:<MessageSquare className="w-4 h-4"/>, name:'Community Reviews',  desc:'Real audience reviews powered by TMDB on every movie & show page' },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @keyframes hfu { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .hfu { animation: hfu 0.45s ease both; }

        /* feedback inputs */
        .fbi {
          width:100%; height:46px; padding:0 14px; border-radius:10px; box-sizing:border-box;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
          color:#fff; font-size:0.9rem; outline:none; font-family:inherit;
          transition:border-color 0.2s, background 0.2s;
        }
        .fbi::placeholder { color:rgba(255,255,255,0.22); }
        .fbi:focus { border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.07); }

        .fbta {
          width:100%; padding:12px 14px; border-radius:10px; box-sizing:border-box; resize:none;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
          color:#fff; font-size:0.9rem; outline:none; font-family:inherit; line-height:1.55;
          transition:border-color 0.2s, background 0.2s;
        }
        .fbta::placeholder { color:rgba(255,255,255,0.22); }
        .fbta:focus { border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.07); }

        /* two-col grid for the middle section */
        .help-mid-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:0 52px;
          align-items:start;
        }
        @media(max-width:860px){
          .help-mid-grid { grid-template-columns:1fr; }
          .help-mid-right { border-left:none !important; padding-left:0 !important; margin-top:40px; }
        }

        @media(max-width:600px){
          .help-outer { padding-left:18px !important; padding-right:18px !important; padding-top:56px !important; }
          .help-title h1 { font-size:1.75rem !important; }
          .help-title-icon { width:22px !important; height:22px !important; }
          .help-title-row { gap:7px !important; }
          .help-title-sub { font-size:0.82rem !important; }
          .feedback-box { padding:18px 16px !important; border-radius:14px !important; }
          .name-email-grid { grid-template-columns:1fr !important; gap:10px !important; }
        }

        .faq-row { border-bottom:1px solid rgba(255,255,255,0.06); }
        .faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:15px 0; background:none; border:none; cursor:pointer; text-align:left; }

        @keyframes spin { to{transform:rotate(360deg)} }

        /* ── Cinematic grain background ── */
        .help-bg {
          position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden;
        }
        .help-bg::before {
          content:'';
          position:absolute; top:-10%; left:50%; transform:translateX(-50%);
          width:70%; height:55%;
          background: radial-gradient(ellipse at center, rgba(139,92,246,0.13) 0%, rgba(109,40,217,0.06) 45%, transparent 75%);
          filter: blur(40px);
        }
        .help-bg::after {
          content:'';
          position:absolute; bottom:-5%; right:5%;
          width:45%; height:40%;
          background: radial-gradient(ellipse at center, rgba(168,85,247,0.09) 0%, transparent 70%);
          filter: blur(50px);
        }
        .help-grain {
          position:fixed; inset:0; z-index:1; pointer-events:none;
          opacity:0.038;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 180px 180px;
          mix-blend-mode: overlay;
        }
        .help-outer { position:relative; z-index:2; }
      `}</style>

      {/* grain + glow layers */}
      <div className="help-bg" aria-hidden="true"/>
      <div className="help-grain" aria-hidden="true"/>

      <div className="help-outer" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', padding:'88px 15% 72px' }}>

        {/* ══ 1. CENTERED TITLE ══ */}
        <div className="hfu help-title" style={{ textAlign:'center', marginBottom:'36px', width:'100%', maxWidth:'100%' }}>
          <div className="help-title-row" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'8px' }}>
            <Anchor className="help-title-icon" style={{ width:30, height:30, color:'var(--primary)' }} />
            <h1 style={{ fontSize:'2.4rem', fontWeight:800, color:'#fff', letterSpacing:'-0.03em', margin:0 }}>Help & Feedback</h1>
          </div>
          <p className="help-title-sub" style={{ fontSize:'0.95rem', color:'rgba(255,255,255,0.38)', margin:0 }}>Everything you need to sail smoothly on PirateOne</p>
        </div>

        {/* ══ 2. FEEDBACK BOX — centered, full width ══ */}
        <div className="hfu" style={{ width:'100%', maxWidth:'100%', marginBottom:'52px' }}>
          <div className="feedback-box" style={{
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:'18px', padding:'28px 32px',
          }}>
            <SL icon={<MessageSquare size={13}/>} label="Rate & Share Feedback" />

            {/* Stars */}
            <div style={{ marginBottom:'22px' }}>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.38)', marginBottom:'10px' }}>How would you rate your experience?</p>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={()=>setRating(s)} onMouseEnter={()=>setHoverRating(s)} onMouseLeave={()=>setHoverRating(0)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'2px', lineHeight:0 }}>
                    <Star style={{
                      width:34, height:34, transition:'all 0.15s',
                      fill:(hoverRating||rating)>=s?'#eab308':'transparent',
                      color:(hoverRating||rating)>=s?'#eab308':'rgba(255,255,255,0.18)',
                      filter:(hoverRating||rating)>=s?'drop-shadow(0 0 6px rgba(234,179,8,0.5))':'none',
                    }}/>
                  </button>
                ))}
                {rating>0 && <span style={{ marginLeft:'10px', fontSize:'0.82rem', fontWeight:600, color:'#eab308' }}>{['','Poor','Fair','Good','Great','Excellent!'][rating]}</span>}
              </div>
            </div>

            {/* Name + Email row */}
            <div className="name-email-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', marginBottom:'7px' }}>
                  Name <span style={{ color:'rgba(255,255,255,0.18)', fontWeight:400 }}>(optional)</span>
                </label>
                <input className="fbi" type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', marginBottom:'7px' }}>
                  Email <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <input className="fbi" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
              </div>
            </div>

            {/* Feedback textarea */}
            <div style={{ marginBottom:'18px' }}>
              <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.32)', marginBottom:'7px' }}>
                Feedback
              </label>
              <textarea className="fbta" rows={4} placeholder="Tell us what you love or what we can improve…" value={feedback} onChange={e=>setFeedback(e.target.value)}/>
            </div>

            {/* Submit */}
            <button
              onClick={submit} disabled={isSubmitting}
              style={{
                height:46, padding:'0 28px', borderRadius:'10px', background:'#fff', border:'none',
                color:'#0a0a0a', fontSize:'0.9rem', fontWeight:700, cursor:'pointer',
                display:'inline-flex', alignItems:'center', gap:'8px', letterSpacing:'0.01em',
                transition:'background 0.2s, transform 0.15s, box-shadow 0.2s',
                opacity: isSubmitting ? 0.5 : 1,
              }}
              onMouseEnter={e=>{ if(!isSubmitting){ (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.4)'; } }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='none'; }}
            >
              {isSubmitting
                ? <><span style={{ width:14, height:14, border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'#0a0a0a', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }}/>Sending…</>
                : <><Send size={15}/>Submit Feedback</>}
            </button>
          </div>
        </div>

        {/* ══ 3. TWO-COLUMN: What's On Board (L) + All Features (R) ══ */}
        <div className="hfu help-mid-grid" style={{ width:'100%', maxWidth:'100%', marginBottom:'52px' }}>

          {/* LEFT — What's On Board */}
          <div>
            <SL icon={<Sparkles size={13}/>} label="What's On Board" />

            {/* 17 Servers */}
            <div style={{ marginBottom:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <div style={{ width:38, height:38, borderRadius:'10px', background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.22)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Server size={17} style={{ color:'var(--primary,#a855f7)' }}/>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                    <span style={{ fontWeight:700, fontSize:'0.95rem', color:'#fff' }}>15 Streaming Servers</span>
                    <span style={{ fontSize:'0.63rem', background:'rgba(168,85,247,0.15)', color:'var(--primary,#a855f7)', border:'1px solid rgba(168,85,247,0.25)', padding:'2px 8px', borderRadius:'99px', fontWeight:700 }}>NEW</span>
                  </div>
                  <p style={{ fontSize:'0.74rem', color:'rgba(255,255,255,0.38)', margin:0 }}>Switch instantly if one goes down</p>
                </div>
              </div>
              <p style={{ fontSize:'0.83rem', color:'rgba(255,255,255,0.45)', lineHeight:1.55, marginBottom:'10px', paddingLeft:'50px' }}>
                Every watch page lets you switch between 15 different servers instantly. If one is slow or broken, another always has you covered.
              </p>
              <div style={{ paddingLeft:'50px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {Array.from({length:15},(_,i)=>(
                  <span key={i} style={{ fontSize:'0.66rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', padding:'2px 8px', borderRadius:'5px', fontFamily:'monospace' }}>S{i+1}</span>
                ))}
              </div>

              {/* Server Comparison */}
              <div style={{ paddingLeft:'50px', marginTop:'14px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr', gap:'6px 10px', alignItems:'center' }}>
                  <span style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.25)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>Group</span>
                  <span style={{ fontSize:'0.62rem', color:'#f97316', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}><Film size={10}/>Movies</span>
                  <span style={{ fontSize:'0.62rem', color:'#3b82f6', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}><Tv size={10}/>TV</span>
                  <span style={{ fontSize:'0.62rem', color:'#a855f7', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}><Sparkles size={10}/>Anime</span>
                  {[
                    { label:'S1–S9', movie:true, tv:true, anime:true },
                    { label:'S10–S15', movie:true, tv:true, anime:false },
                  ].map(row => (
                    <React.Fragment key={row.label}>
                      <span style={{ fontSize:'0.66rem', fontFamily:'monospace', color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'2px 7px', borderRadius:'5px', width:'fit-content' }}>{row.label}</span>
                      {[row.movie, row.tv, row.anime].map((ok, j) => (
                        <span key={j} style={{ textAlign:'center', display:'flex', justifyContent:'center' }}>{ok ? <CheckCircle size={13} style={{ color:'#22c55e' }}/> : <XCircle size={13} style={{ color:'#ef4444' }}/>}</span>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Downloads */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <div style={{ width:38, height:38, borderRadius:'10px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.22)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Download size={17} style={{ color:'#34d399' }}/>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                    <span style={{ fontWeight:700, fontSize:'0.95rem', color:'#fff' }}>Download Any Show</span>
                    <span style={{ fontSize:'0.63rem', background:'rgba(16,185,129,0.15)', color:'#34d399', border:'1px solid rgba(16,185,129,0.25)', padding:'2px 8px', borderRadius:'99px', fontWeight:700 }}>NEW</span>
                  </div>
                  <p style={{ fontSize:'0.74rem', color:'rgba(255,255,255,0.38)', margin:0 }}>Offline viewing, your quality</p>
                </div>
              </div>
              <p style={{ fontSize:'0.83rem', color:'rgba(255,255,255,0.45)', lineHeight:1.55, marginBottom:'10px', paddingLeft:'50px' }}>
                Download movies and episodes directly from the watch page. Pick your quality before downloading — no subscription needed.
              </p>
              <div style={{ paddingLeft:'50px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {['480p','720p','1080p','4K'].map(q=>(
                  <span key={q} style={{ fontSize:'0.66rem', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', color:'#34d399', padding:'2px 8px', borderRadius:'5px', fontFamily:'monospace' }}>{q}</span>
                ))}
              </div>
            </div>

            {/* ── Quick Tips ── */}
            <div style={{ marginTop:'40px', paddingTop:'32px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <SL icon={<Lightbulb size={13}/>} label="Quick Tips" />
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {tips.map((tip,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'12px 14px' }}>
                    <span style={{ flexShrink:0, width:22, height:22, borderRadius:'99px', background:'rgba(234,179,8,0.12)', border:'1px solid rgba(234,179,8,0.2)', color:'#eab308', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700 }}>{i+1}</span>
                    <p style={{ fontSize:'0.83rem', color:'rgba(255,255,255,0.5)', lineHeight:1.5, margin:0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Library Status Guide ── */}
            <div style={{ marginTop:'32px', paddingTop:'32px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <SL icon={<Library size={13}/>} label="Library Status Guide" />
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  { label:'Watching',      color:'#3b82f6', bg:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.2)',  desc:'Currently watching this title' },
                  { label:'Completed',     color:'#22c55e', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.2)',   desc:'Finished watching — marked as done' },
                  { label:'Dropped',       color:'#ef4444', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.2)',   desc:'Stopped watching — saved for reference' },
                  { label:'Plan to Watch', color:'#eab308', bg:'rgba(234,179,8,0.1)',   border:'rgba(234,179,8,0.2)',   desc:'Added to watchlist for later' },
                ].map(s=>(
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'9px' }}>
                    <span style={{ flexShrink:0, fontSize:'0.67rem', fontWeight:700, padding:'2px 9px', borderRadius:'99px', background:s.bg, border:`1px solid ${s.border}`, color:s.color }}>{s.label}</span>
                    <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', margin:0, lineHeight:1.4 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>


          </div>

          {/* RIGHT — All Features */}
          <div className="help-mid-right" style={{ borderLeft:'1px solid rgba(255,255,255,0.06)', paddingLeft:'52px' }}>
            <SL icon={<Sparkles size={13}/>} label="All Features" />
            {featureGroups.map(group=>(
              <div key={group.label} style={{ marginBottom:'22px' }}>
                <p className={cn('text-xs font-bold uppercase tracking-widest mb-3', group.color)}>{group.label}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 20px' }}>
                  {group.features.map(f=>(
                    <div key={f.name} style={{ display:'flex', alignItems:'flex-start', gap:'9px' }}>
                      <div className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border', group.ib, group.ibr, group.ic)} style={{ marginTop:2 }}>{f.icon}</div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#fff' }}>{f.name}</span>
                          <CheckCircle style={{ width:11, height:11, color:'#22c55e', flexShrink:0 }}/>
                        </div>
                        <p style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.35)', marginTop:'2px', lineHeight:1.4 }}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ 4. KEYBOARD SHORTCUTS ══ */}
        <div className="hfu" style={{ width:'100%', maxWidth:'100%', marginBottom:'52px' }}>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'40px' }}>
            <SL icon={<Keyboard size={13}/>} label="Keyboard Shortcuts" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 40px' }}>
              {[
                { group:'Global', color:'#a855f7', keys:[
                  { key:'/', action:'Open & focus the Search bar' },
                  { key:'Esc', action:'Dismiss panels' },
                ]},
                { group:'Watch Page', color:'#3b82f6', keys:[
                  { key:'Server N', action:'Switch server from the server menu' },
                ]},
              ].map(group => (
                <div key={group.group}>
                  <p style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:group.color, marginBottom:'10px' }}>{group.group}</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {group.keys.map(k => (
                      <div key={k.key} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'8px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'9px' }}>
                        <kbd style={{ flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:36, padding:'2px 8px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderBottom:'2px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontSize:'0.7rem', fontFamily:'monospace', color:'#fff', fontWeight:600, whiteSpace:'nowrap' }}>{k.key}</kbd>
                        <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)' }}>{k.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ marginTop:'14px', fontSize:'0.72rem', color:'rgba(255,255,255,0.22)' }}>
              Shortcuts don't fire when typing inside a text input or textarea.
            </p>
          </div>
        </div>


        {/* ══ 6. FAQ — full width, centered ══ */}
        <div className="hfu" style={{ width:'100%', maxWidth:'100%', marginBottom:'32px' }}>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'40px' }}>
            <SL icon={<HelpCircle size={13}/>} label="Frequently Asked Questions" />
            <div>
              {faqs.map((faq,i)=>(
                <div key={i} className="faq-row">
                  <button className="faq-btn" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                    <span style={{ fontSize:'0.9rem', fontWeight:500, color:openFaq===i?'var(--primary,#a855f7)':'#fff', transition:'color 0.2s' }}>{faq.q}</span>
                    {openFaq===i
                      ? <ChevronUp style={{ width:15, height:15, color:'var(--primary,#a855f7)', flexShrink:0 }}/>
                      : <ChevronDown style={{ width:15, height:15, color:'rgba(255,255,255,0.28)', flexShrink:0 }}/>}
                  </button>
                  {openFaq===i && <p style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.45)', paddingBottom:'14px', lineHeight:1.65, margin:0 }}>{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.15)', letterSpacing:'0.05em', textAlign:'center' }}>
          <Anchor size={11} style={{ display:'inline', verticalAlign:'middle', marginRight:5 }}/>PirateOne · Your feedback matters
        </p>
      </div>
    </>
  );
};

export default Help;
