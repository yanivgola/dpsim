import React, { useEffect } from 'react';

const MagicMouseTrail: React.FC = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const trail = document.createElement('div');
      trail.className = 'trail';
      trail.style.left = `${e.pageX}px`;
      trail.style.top = `${e.pageY}px`;
      document.body.appendChild(trail);

      setTimeout(() => {
        trail.remove();
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <style>{`
      .trail {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #60a5fa;
        animation: fadeOut 1s forwards;
        pointer-events: none;
        z-index: 9999;
      }

      @keyframes fadeOut {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0);
        }
      }
    `}</style>
  );
};

export default MagicMouseTrail;
