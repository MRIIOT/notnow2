'use client';

import { useState } from 'react';

interface TaskInputProps {
  onSubmit: (title: string) => void;
}

export function TaskInput({ onSubmit }: TaskInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="py-3.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="+ Add task..."
        className="w-full bg-bg-raised border border-border rounded px-3.5 py-2.5 font-body text-[13px] text-text outline-none focus:border-accent placeholder:text-text-tertiary transition-colors"
      />
    </form>
  );
}
