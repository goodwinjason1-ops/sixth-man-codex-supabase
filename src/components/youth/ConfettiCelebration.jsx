import React, { useEffect, useState } from 'react';

const COLORS = ['#FFD700', '#FF6B35', '#00A651', '#3B82F6', '#EC4899'];

const ConfettiCelebration = ({ trigger }) => {
  const [show, setShow] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: 4 + Math.random() * 4,
      drift: (Math.random() - 0.5) * 40,
    }))
  );

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            backgroundColor: p.color,
            animation: `confetti-fall 2s ease-in forwards`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiCelebration;
