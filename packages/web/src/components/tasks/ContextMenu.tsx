'use client';

import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, onComplete, onCancel, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed bg-bg-raised border border-border rounded-lg p-[5px] min-w-[180px] z-[200] shadow-2xl"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onComplete}
        className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text transition-all"
      >
        <span className="font-mono text-[12px] w-4 text-center text-green">&#10003;</span>
        Complete
      </button>
      <button
        onClick={onCancel}
        className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text transition-all"
      >
        <span className="font-mono text-[12px] w-4 text-center text-red">&#10005;</span>
        Cancel
      </button>
      <div className="h-px bg-border mx-2 my-[3px]" />
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text transition-all"
      >
        <span className="font-mono text-[12px] w-4 text-center text-text-tertiary">&#9249;</span>
        Delete
      </button>
    </div>
  );
}
