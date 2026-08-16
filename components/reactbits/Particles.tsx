import React, { useRef, useEffect } from 'react';

interface ParticlesProps {
  quantity?: number;
  staticity?: number;
  ease?: number;
  color?: string;
  className?: string;
}

export const Particles: React.FC<ParticlesProps> = ({
  quantity = 40,
  staticity = 50,
  ease = 50,
  color = '#818cf8',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouse = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
  });

  type Particle = {
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
  };

  const circles = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const circleParams = (): Particle => {
      const x = Math.floor(Math.random() * canvas.offsetWidth);
      const y = Math.floor(Math.random() * canvas.offsetHeight);
      const translateX = 0;
      const translateY = 0;
      const size = Math.floor(Math.random() * 2) + 1.2;
      const alpha = 0;
      const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
      const dx = (Math.random() - 0.5) * 0.2;
      const dy = (Math.random() - 0.5) * 0.2;
      const magnetism = 0.1 + Math.random() * 4;
      return { x, y, translateX, translateY, size, alpha, targetAlpha, dx, dy, magnetism };
    };

    const initCircles = () => {
      circles.current = [];
      for (let i = 0; i < quantity; i++) {
        circles.current.push(circleParams());
      }
    };

    const drawCircle = (circle: Particle, update = false) => {
      const { x, y, translateX, translateY, size, alpha } = circle;
      ctx.translate(translateX, translateY);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

      if (!update) return;

      if (circle.alpha < circle.targetAlpha) {
        circle.alpha += 0.02;
      }

      circle.x += circle.dx;
      circle.y += circle.dy;
      circle.translateX += ((mouse.current.x / (staticity / circle.magnetism)) - circle.translateX) / ease;
      circle.translateY += ((mouse.current.y / (staticity / circle.magnetism)) - circle.translateY) / ease;

      if (
        circle.x < -circle.size ||
        circle.x > canvas.offsetWidth + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvas.offsetHeight + circle.size
      ) {
        Object.assign(circle, circleParams());
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { clientX, clientY } = event;
      const x = clientX - rect.left - canvas.offsetWidth / 2;
      const y = clientY - rect.top - canvas.offsetHeight / 2;
      mousePosition.current = { x, y };
    };

    resizeCanvas();
    initCircles();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      mouse.current.x += (mousePosition.current.x - mouse.current.x) / ease;
      mouse.current.y += (mousePosition.current.y - mouse.current.y) / ease;

      circles.current.forEach((circle) => {
        drawCircle(circle, true);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [quantity, staticity, ease, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
};

export default Particles;
