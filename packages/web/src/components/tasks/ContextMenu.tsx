'use client';

import { useEffect, useRef, useState } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onComplete: () => void;
  onCancel: (reason?: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, onComplete, onCancel, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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
      className="fixed bg-bg-raised border border-border rounded-lg p-[5px] min-w-[200px] z-[200] shadow-2xl"
      style={{ left: x, top: y }}
    >
      <button
        onClick={onComplete}
        className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text transition-all"
      >
        <span className="font-mono text-[12px] w-4 text-center text-green">&#10003;</span>
        Complete
      </button>

      {showCancelInput ? (
        <div className="px-3 py-1.5">
          <p className="font-mono text-[10px] text-text-tertiary mb-1.5 uppercase tracking-wide">Reason (optional)</p>
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCancel(cancelReason || undefined);
                if (e.key === 'Escape') setShowCancelInput(false);
              }}
              placeholder="duplicate, no longer needed..."
              className="flex-1 bg-bg border border-border rounded px-2 py-1 text-[11px] text-text font-mono outline-none focus:border-accent"
            />
            <button
              onClick={() => onCancel(cancelReason || undefined)}
              className="font-mono text-[10px] text-red bg-red-dim border border-red rounded px-2 py-1 hover:bg-red hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={() => onCancel(undefined)}
            className="font-mono text-[10px] text-text-tertiary mt-1 hover:text-text-secondary"
          >
            Skip reason
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCancelInput(true)}
          className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded text-[13px] text-text-secondary hover:bg-bg-hover hover:text-text transition-all"
        >
          <span className="font-mono text-[12px] w-4 text-center text-red">&#10005;</span>
          Cancel
        </button>
      )}

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
