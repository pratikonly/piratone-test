import { useEffect, useState } from 'react';

const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
      
      {/* Animated gradient orbs */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-pulse"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(330 90% 50%) 50%, hsl(280 70% 40%) 100%)',
          top: `${20 + mousePosition.y * 0.1}%`,
          left: `${10 + mousePosition.x * 0.1}%`,
          transform: 'translate(-50%, -50%)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
        style={{
          background: 'linear-gradient(225deg, hsl(280 70% 50%) 0%, hsl(var(--primary)) 100%)',
          bottom: `${10 + (100 - mousePosition.y) * 0.1}%`,
          right: `${10 + (100 - mousePosition.x) * 0.1}%`,
          transform: 'translate(50%, 50%)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
        style={{
          background: 'linear-gradient(45deg, hsl(200 80% 50%) 0%, hsl(var(--primary)) 100%)',
          top: '60%',
          left: '60%',
          transform: 'translate(-50%, -50%)',
          animation: 'float 12s ease-in-out infinite',
        }}
      />

      {/* Film grain effect */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scanlines effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Moving gradient lines */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div 
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{
            top: '30%',
            animation: 'slideRight 15s linear infinite',
          }}
        />
        <div 
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{
            top: '60%',
            animation: 'slideRight 20s linear infinite reverse',
          }}
        />
        <div 
          className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-primary to-transparent"
          style={{
            left: '40%',
            animation: 'slideDown 18s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes slideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
