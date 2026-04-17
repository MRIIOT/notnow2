'use client';

import { useDroppable } from '@dnd-kit/core';

interface DroppableSectionProps {
  id: string;
  children: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  lineColor: string;
  isEmpty: boolean;
  overSection: string | null;
}

export function DroppableSection({
  id, children, label, sublabel, color, lineColor, isEmpty, overSection,
}: DroppableSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isHighlighted = isOver || overSection === id;

  return (
    <div className="mb-2">
      <div className={`font-mono text-[10px] font-semibold uppercase tracking-[1.5px] ${color} pt-3 pb-1.5 flex items-center gap-2`}>
        {label}
        {sublabel && <span className="font-normal opacity-60 normal-case tracking-normal">{sublabel}</span>}
        <div className={`flex-1 h-px ${lineColor}`} />
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[36px] rounded transition-colors ${isHighlighted ? 'bg-bg-hover ring-1 ring-accent/30' : ''}`}
      >
        {children}
        {isEmpty && (
          <div className={`flex items-center justify-center py-3 text-[11px] font-mono transition-colors ${
            isHighlighted ? 'text-text-secondary' : 'text-text-tertiary opacity-40'
          }`}>
            {isHighlighted ? 'Drop here' : 'Empty'}
          </div>
        )}
      </div>
    </div>
  );
}
