'use client';

import { useRef, useState, useCallback } from 'react';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
}

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const [revealed, setRevealed] = useState(false);
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
    setDragX(0);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;

    if (revealed) {
      // If already revealed, swiping right should hide
      if (dx > 0) {
        setDragX(dx);
      }
    } else {
      // Swiping left to reveal
      if (dx < 0) {
        setDragX(dx);
      }
    }
  }, [revealed]);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;

    if (revealed) {
      // If swiped right enough, hide the button
      if (dragX > 30) {
        setRevealed(false);
      }
    } else {
      // If swiped left enough, reveal the button
      if (dragX < -40) {
        setRevealed(true);
      }
    }
    setDragX(0);
  }, [dragX, revealed]);

  // On desktop, render children directly with no wrapper
  return (
    <div className="relative overflow-hidden md:contents">
      {/* Delete button — positioned at right edge, revealed by shrinking content */}
      <div className={`
        absolute inset-y-0 right-0 flex items-center md:hidden
        transition-opacity duration-150
        ${revealed ? 'opacity-100' : 'opacity-0'}
      `}>
        <button
          onClick={() => {
            onDelete();
            setRevealed(false);
          }}
          className="bg-red text-white font-mono text-[11px] font-semibold h-full px-5 flex items-center"
        >
          Delete
        </button>
      </div>

      {/* Content — does not move, just clips to reveal delete button */}
      <div
        className="relative bg-inherit md:!mr-0"
        style={{
          marginRight: revealed ? 70 : dragX < 0 ? Math.min(-dragX, 70) : revealed && dragX > 0 ? Math.max(70 - dragX, 0) : 0,
          transition: isDragging.current ? 'none' : 'margin-right 0.2s ease-out',
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
