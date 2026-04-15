'use client';

import { useRef, useState, useCallback } from 'react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
}

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const touchStartX = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) {
      setOffsetX(Math.max(dx, -80));
    } else if (!showButton) {
      setOffsetX(0);
    }
  }, [showButton]);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (offsetX < -40) {
      setShowButton(true);
      setOffsetX(-70);
    } else {
      setShowButton(false);
      setOffsetX(0);
    }
  }, [offsetX]);

  const close = useCallback(() => {
    setShowButton(false);
    setOffsetX(0);
  }, []);

  return (
    <div className="relative overflow-hidden md:contents">
      {/* Delete button behind */}
      <div className="absolute inset-y-0 right-0 flex items-center md:hidden">
        <button
          onClick={() => {
            onDelete();
            close();
          }}
          className="bg-red text-white font-mono text-[11px] font-semibold h-full px-5 flex items-center"
        >
          Delete
        </button>
      </div>

      {/* Sliding content */}
      <div
        className="relative bg-bg md:!transform-none"
        style={{
          transform: offsetX !== 0 ? `translateX(${offsetX}px)` : undefined,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
