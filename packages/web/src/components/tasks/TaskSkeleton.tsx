'use client';

export function TaskSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-[9px]">
          <div className="w-3 h-3 rounded bg-bg-active shrink-0" />
          <div className="w-4 h-4 rounded-[3px] bg-bg-active shrink-0" />
          <div className="h-3.5 rounded bg-bg-active" style={{ width: `${40 + Math.random() * 40}%` }} />
          <div className="ml-auto h-3 w-12 rounded bg-bg-active shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
      <span className="text-[32px] mb-3 opacity-30">{icon}</span>
      <p className="text-[13px]">{message}</p>
    </div>
  );
}
