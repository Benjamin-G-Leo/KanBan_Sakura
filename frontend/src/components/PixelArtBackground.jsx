import { useEffect, useRef, useState } from 'react';

function createParticle(width, height, theme) {
  const size = 4;
  const colors = theme === 'dark'
    ? ['#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#fff1f7']
    : ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'];

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size,
    speedY: Math.random() * 0.8 + 0.4,
    speedX: (Math.random() - 0.5) * 0.6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    opacity: Math.random() * 0.3 + 0.55,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.01 + 0.005,
    swayAmount: Math.random() * 1.5 + 0.5,
  };
}

export function PixelArtBackground() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark',
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (event) => setReducedMotion(event.matches);
    const handleThemeChange = () => setTheme(root.getAttribute('data-theme') || 'dark');

    mediaQuery.addEventListener('change', handleMotionChange);
    root.addEventListener('themechange', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      root.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    let width = 0;
    let height = 0;

    const initializeParticles = () => {
      const count = Math.max(24, Math.min(Math.ceil((width * height) / 10000), 120));
      particlesRef.current = Array.from(
        { length: count },
        () => createParticle(width, height, theme),
      );
    };

    const draw = (advanceParticles) => {
      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((particle, index) => {
        if (advanceParticles) {
          particle.y += particle.speedY;
          particle.x += particle.speedX + Math.sin(particle.sway) * particle.swayAmount * 0.02;
          particle.sway += particle.swaySpeed;
          particle.rotation += particle.rotationSpeed;

          if (
            particle.y > height + particle.size
            || particle.x < -particle.size
            || particle.x > width + particle.size
          ) {
            particlesRef.current[index] = createParticle(width, height, theme);
            particlesRef.current[index].y = -particle.size;
            return;
          }
        }

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.opacity * (reducedMotion ? 0.5 : 1);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width || window.innerWidth;
      height = rect?.height || window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      initializeParticles();
      draw(false);
    };

    const animate = () => {
      draw(true);
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    if (!reducedMotion) animationRef.current = requestAnimationFrame(animate);
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [reducedMotion, theme]);

  const gradient = theme === 'dark'
    ? 'linear-gradient(180deg, rgba(9,13,22,0.12) 0%, rgba(15,23,42,0.24) 50%, rgba(30,27,75,0.44) 100%)'
    : 'linear-gradient(180deg, rgba(255,241,247,0.12) 0%, rgba(252,231,243,0.24) 50%, rgba(251,207,232,0.44) 100%)';

  return (
    <div
      className="pixel-art-bg"
      role="img"
      aria-label={reducedMotion ? 'Static decorative sakura blossoms' : 'Animated falling sakura blossoms'}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
      <div className="pixel-art-gradient" style={{ background: gradient }} />
    </div>
  );
}

export default PixelArtBackground;
