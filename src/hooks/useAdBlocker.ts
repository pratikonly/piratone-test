import { useEffect, useRef, useCallback } from 'react';

interface UseAdBlockerOptions {
  enabled?: boolean;
  onAdBlocked?: (type: string) => void;
}

const NOOP = () => null;

const isAd = (url: string): boolean => {
  if (!url || url === 'about:blank' || url.startsWith('javascript:')) return false;
  // Same origin = not an ad redirect
  try {
    const u = new URL(url, window.location.href);
    if (u.origin === window.location.origin) return false;
    // Always block these known ad/redirect domains
    const AD_DOMAINS = [
      /doubleclick\.net/i, /googlesyndication/i, /adnxs\.com/i, /adsystem/i,
      /openx\.net/i, /rubiconproject/i, /pubmatic\.com/i, /outbrain\.com/i,
      /taboola\.com/i, /exoclick/i, /trafficjunky/i, /popads/i, /popcash/i,
      /adcash/i, /hilltopads/i, /revcontent/i, /propellerads/i, /adsterra/i,
      /juicyads/i, /trafficstars/i, /plugrush/i, /eroadvertising/i,
    ];
    if (AD_DOMAINS.some(p => p.test(u.hostname))) return true;
    // Block anything that isn't a video streaming / CDN domain
    const ALLOWED = [
      /vidsrc/i, /videasy/i, /multiembed/i, /2embed/i, /autoembed/i,
      /smashystream/i, /embedsoap/i, /moviesapi/i, /streamtape/i,
      /dood/i, /mixdrop/i, /filemoon/i, /tmdb/i, /themoviedb/i,
      /jwplatform/i, /jwpcdn/i, /cloudfront/i, /akamai/i, /fastly/i,
    ];
    // If it's not an allowed domain, it's suspicious — block it
    if (!ALLOWED.some(p => p.test(u.hostname))) return true;
    return false;
  } catch {
    return false;
  }
};

const lockWindow = (win: Window, log: (t: string) => void) => {
  try {
    // window.open
    win.open = NOOP as typeof window.open;

    // location.assign / replace / href
    const locProto = Object.getPrototypeOf(win.location) as Location;
    ['assign', 'replace'].forEach(method => {
      try {
        Object.defineProperty(locProto, method, {
          configurable: true,
          value: function (url: string | URL) {
            if (isAd(url?.toString() ?? '')) { log(`location.${method}`); return; }
            (method === 'assign' ? win.location.assign : win.location.replace).call(win.location, url);
          },
        });
      } catch { /* ignore */ }
    });

    const hrefDesc = Object.getOwnPropertyDescriptor(locProto, 'href');
    if (hrefDesc?.set) {
      const origSet = hrefDesc.set;
      try {
        Object.defineProperty(locProto, 'href', {
          configurable: true,
          get: hrefDesc.get,
          set(url: string) {
            if (isAd(url)) { log('location.href'); return; }
            origSet.call(win.location, url);
          },
        });
      } catch { /* ignore */ }
    }

    // history navigation to external URLs
    const origPush = win.history.pushState.bind(win.history);
    const origReplace = win.history.replaceState.bind(win.history);
    win.history.pushState = (state, title, url) => {
      if (url && isAd(url.toString())) { log('history.pushState'); return; }
      origPush(state, title, url);
    };
    win.history.replaceState = (state, title, url) => {
      if (url && isAd(url.toString())) { log('history.replaceState'); return; }
      origReplace(state, title, url);
    };

    // Dialogs
    win.alert = (msg?: string) => { if (msg) log('alert-blocked'); };
    win.confirm = () => { log('confirm-blocked'); return false; };
    win.prompt = () => { log('prompt-blocked'); return null; };
  } catch { /* cross-origin iframe — can't access contentWindow, that's fine */ }
};

export const useAdBlocker = ({ enabled = true, onAdBlocked }: UseAdBlockerOptions = {}) => {
  const logRef = useRef(onAdBlocked);
  logRef.current = onAdBlocked;
  const log = useCallback((type: string) => { logRef.current?.(type); }, []);
  const iframesLocked = useRef<Set<HTMLIFrameElement>>(new Set());

  // ── 1. Lock parent window ────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    lockWindow(window, log);
    // Re-enforce window.open every 50ms — ad scripts try to overwrite it
    const iv = setInterval(() => {
      if (window.open !== (NOOP as typeof window.open)) {
        window.open = NOOP as typeof window.open;
        log('popup-overwrite-attempt');
      }
    }, 50);
    return () => clearInterval(iv);
  }, [enabled, log]);

  // ── 2. Lock same-origin iframes' contentWindow after they load ───────────────
  useEffect(() => {
    if (!enabled) return;

    const lockIframe = (iframe: HTMLIFrameElement) => {
      if (iframesLocked.current.has(iframe)) return;
      iframesLocked.current.add(iframe);
      const doLock = () => {
        try {
          if (iframe.contentWindow) lockWindow(iframe.contentWindow, log);
        } catch { /* cross-origin, skip */ }
      };
      iframe.addEventListener('load', doLock);
      doLock(); // Try immediately in case already loaded
    };

    // Lock existing iframes
    document.querySelectorAll<HTMLIFrameElement>('iframe').forEach(lockIframe);

    // Lock future iframes
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            // Remove known ad iframes entirely
            const src = node.src || '';
            const AD_IFRAME = [
              /doubleclick/i, /googlesyndication/i, /adnxs/i, /adsystem/i,
              /popads/i, /popcash/i, /exoclick/i, /propellerads/i, /adsterra/i,
              /trafficjunky/i, /juicyads/i,
            ];
            if (AD_IFRAME.some(p => p.test(src))) {
              node.remove();
              log('injected-iframe');
            } else {
              lockIframe(node);
            }
          }
          // Remove injected ad scripts
          if (node instanceof HTMLScriptElement) {
            const src = node.src || '';
            const AD_SCRIPTS = [/doubleclick/i, /googlesyndication/i, /adnxs/i, /adsystem/i, /exoclick/i];
            if (src && AD_SCRIPTS.some(p => p.test(src))) {
              node.remove();
              log('injected-script');
            }
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => { observer.disconnect(); iframesLocked.current.clear(); };
  }, [enabled, log]);

  // ── 3. Block external anchor / form submissions ──────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const handleClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') ?? '';
      const target = a.getAttribute('target') ?? '';
      if (isAd(href) || ['_blank', '_top', '_parent'].includes(target) && isAd(href)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        logRef.current?.('external-link');
      }
    };
    const handleSubmit = (e: SubmitEvent) => {
      const action = (e.target as HTMLFormElement)?.action ?? '';
      if (isAd(action)) { e.preventDefault(); e.stopImmediatePropagation(); logRef.current?.('form-submit'); }
    };
    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, [enabled]);

  // ── 4. Block postMessage navigation commands ─────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const NAV = /\b(window\.location|top\.location|parent\.location|self\.location)\s*[=.]/i;
    const handle = (e: MessageEvent) => {
      if (typeof e.data === 'string' && NAV.test(e.data)) {
        e.stopImmediatePropagation();
        log('postMessage-nav');
      }
    };
    window.addEventListener('message', handle, true);
    return () => window.removeEventListener('message', handle, true);
  }, [enabled, log]);

  // ── 5. Block document.write/writeln injection ────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const origWrite = document.write.bind(document);
    const origWriteln = document.writeln.bind(document);
    const suspicious = (s: string) => /<(script|iframe)/i.test(s) && /https?:/i.test(s);
    document.write = (s: string) => { if (suspicious(s)) log('doc.write'); else origWrite(s); };
    document.writeln = (s: string) => { if (suspicious(s)) log('doc.writeln'); else origWriteln(s); };
    return () => { document.write = origWrite; document.writeln = origWriteln; };
  }, [enabled, log]);

  return { isEnabled: enabled };
};
