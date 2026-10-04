import { useRef, useState } from 'react';
import { X, ExternalLink, GripHorizontal } from 'lucide-react';
import { useFloatingPlayer } from '@/contexts/FloatingPlayerContext';
import { getPlayerUrl } from '@/lib/tmdb';
import { useNavigate } from 'react-router-dom';

const FloatingPlayer = () => {
  const { floatingPlayer, closeFloatingPlayer } = useFloatingPlayer();
  const navigate = useNavigate();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });

  if (!floatingPlayer) return null;

  const { id, mediaType, season, episode, server, title, watchPath } = floatingPlayer;
  const playerUrl = getPlayerUrl(id, mediaType, server, season, episode);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startOffset.current = { ...offset };

    const onMove = (me: MouseEvent) => {
      if (!isDragging.current) return;
      setOffset({
        x: startOffset.current.x + (me.clientX - startMouse.current.x),
        y: startOffset.current.y - (me.clientY - startMouse.current.y),
      });
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `${88 + offset.y}px`,
        right: `${24 - offset.x}px`,
        zIndex: 9999,
        width: 320,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.12)',
        background: '#0a0a0a',
        userSelect: 'none',
      }}
    >
      {/* Drag handle / header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 10px',
          background: 'rgba(255,255,255,0.05)',
          cursor: 'grab',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <GripHorizontal size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        <span style={{
          fontSize: '0.72rem', fontWeight: 600, color: '#fff',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
        <button
          onClick={() => { closeFloatingPlayer(); navigate(watchPath); }}
          title="Open full player"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.45)', lineHeight: 0 }}
        >
          <ExternalLink size={12} />
        </button>
        <button
          onClick={closeFloatingPlayer}
          title="Close"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.45)', lineHeight: 0 }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Player iframe */}
      <iframe
        src={playerUrl}
        style={{ width: '100%', height: 180, display: 'block', border: 'none' }}
        allow="autoplay; fullscreen *"
        allowFullScreen
        title={title}
      />
    </div>
  );
};

export default FloatingPlayer;
