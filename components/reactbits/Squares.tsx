import React, { useRef, useEffect } from 'react';

interface SquaresProps {
  direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
  className?: string;
}

export const Squares: React.FC<SquaresProps> = ({
  direction = 'diagonal',
  speed = 0.5,
  borderColor = 'rgba(255, 255, 255, 0.08)',
  squareSize = 48,
  hoverFillColor = 'rgba(99, 102, 241, 0.18)',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridOffset = useRef({ x: 0, y: 0 });
  const hoveredSquare = useRef<{ x: number; y: number } | null>(null);

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

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const startX = Math.floor((mouseX + (gridOffset.current.x % squareSize)) / squareSize);
      const startY = Math.floor((mouseY + (gridOffset.current.y % squareSize)) / squareSize);

      hoveredSquare.current = { x: startX, y: startY };
    };

    const handleMouseLeave = () => {
      hoveredSquare.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numCols = Math.ceil(canvas.offsetWidth / squareSize) + 2;
      const numRows = Math.ceil(canvas.offsetHeight / squareSize) + 2;

      const offsetX = gridOffset.current.x % squareSize;
      const offsetY = gridOffset.current.y % squareSize;

      for (let i = -1; i < numCols; i++) {
        for (let j = -1; j < numRows; j++) {
          const x = i * squareSize - offsetX;
          const y = j * squareSize - offsetY;

          if (
            hoveredSquare.current &&
            hoveredSquare.current.x === i &&
            hoveredSquare.current.y === j
          ) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(x, y, squareSize, squareSize);
          }

          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, squareSize, squareSize);
        }
      }

      switch (direction) {
        case 'right':
          gridOffset.current.x -= speed;
          break;
        case 'left':
          gridOffset.current.x += speed;
          break;
        case 'up':
          gridOffset.current.y += speed;
          break;
        case 'down':
          gridOffset.current.y -= speed;
          break;
        case 'diagonal':
          gridOffset.current.x -= speed;
          gridOffset.current.y -= speed;
          break;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [direction, speed, borderColor, squareSize, hoverFillColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none ${className}`}
      style={{ display: 'block' }}
    />
  );
};

export default Squares;
