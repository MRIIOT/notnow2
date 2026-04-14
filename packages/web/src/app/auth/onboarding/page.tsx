'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function OnboardingPage() {
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const { user, createTeam, checkHandle } = useAuth();
  const router = useRouter();

  const onHandleChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setHandle(clean);
    if (clean.length >= 3) {
      const avail = await checkHandle(clean);
      setHandleAvailable(avail);
    } else {
      setHandleAvailable(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTeam(handle, displayName);
      router.push('/app');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-9 w-[380px] max-w-[90vw]">
      <div className="font-mono font-bold text-[22px] text-text">
        notnow<span className="text-text-tertiary">.</span>
      </div>
      <p className="text-[13px] text-text-secondary mb-7">
        Welcome @{user?.username}! Create a team to get started.
      </p>

      <form onSubmit={onSubmit}>
        <label className="block font-mono text-[11px] font-medium text-text-secondary tracking-wide mb-1">
          Team @handle
        </label>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[13px] text-text-tertiary shrink-0">@</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => onHandleChange(e.target.value)}
            className="flex-1 bg-bg border border-border rounded px-3 py-2.5 font-body text-[13px] text-text outline-none focus:border-accent"
            required
            minLength={3}
          />
          {handleAvailable !== null && (
            <span className={`font-mono text-[11px] shrink-0 ${handleAvailable ? 'text-green' : 'text-red'}`}>
              {handleAvailable ? '✓ available' : '✕ taken'}
            </span>
          )}
        </div>

        <label className="block font-mono text-[11px] font-medium text-text-secondary tracking-wide mb-1">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-bg border border-border rounded px-3 py-2.5 font-body text-[13px] text-text outline-none focus:border-accent mb-4"
          required
        />

        {error && <p className="text-red text-[12px] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading || handleAvailable === false}
          className="w-full bg-accent text-bg font-mono text-[13px] font-semibold rounded py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </form>
    </div>
  );
}
