/**
 * Shared page background: the same cinematic glow + film grain used on the Help page.
 * Fixed behind the page content (the Layout's <main> sits above it at z-10).
 */
const PageBackground = () => (
  <>
    <style>{`
      .page-bg {
        position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
      }
      .page-bg::before {
        content: '';
        position: absolute; top: -10%; left: 50%; transform: translateX(-50%);
        width: 70%; height: 55%;
        background: radial-gradient(ellipse at center, rgba(139,92,246,0.13) 0%, rgba(109,40,217,0.06) 45%, transparent 75%);
        filter: blur(40px);
      }
      .page-bg::after {
        content: '';
        position: absolute; bottom: -5%; right: 5%;
        width: 45%; height: 40%;
        background: radial-gradient(ellipse at center, rgba(168,85,247,0.09) 0%, transparent 70%);
        filter: blur(50px);
      }
      .page-grain {
        position: fixed; inset: 0; z-index: 1; pointer-events: none;
        opacity: 0.038;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        background-repeat: repeat;
        background-size: 180px 180px;
        mix-blend-mode: overlay;
      }
    `}</style>
    <div className="page-bg" aria-hidden="true" />
    <div className="page-grain" aria-hidden="true" />
  </>
);

export default PageBackground;