'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const { signup, checkHandle } = useAuth();
  const router = useRouter();

  const onUsernameChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
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
      await signup(username, email, password);
      router.push('/auth/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-9 w-[380px] max-w-[90vw] animate-fade-in">
      <img src="/logo.png" alt="notnow" className="w-10 h-10 rounded mb-1" />
      <p className="text-[13px] text-text-secondary mb-7">Tasks that wait until you&apos;re ready.</p>

      <form onSubmit={onSubmit}>
        <label className="block font-mono text-[11px] font-medium text-text-secondary tracking-wide mb-1">
          Your @username
        </label>
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[13px] text-text-tertiary shrink-0">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
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

        <label className="block font-mono text-[11px] font-medium text-text-secondary tracking-wide mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-bg border border-border rounded px-3 py-2.5 font-body text-[13px] text-text outline-none focus:border-accent mb-4"
          required
        />

        <label className="block font-mono text-[11px] font-medium text-text-secondary tracking-wide mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-bg border border-border rounded px-3 py-2.5 font-body text-[13px] text-text outline-none focus:border-accent mb-4"
          required
          minLength={6}
        />

        {error && <p className="text-red text-[12px] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading || handleAvailable === false}
          className="w-full bg-accent text-bg font-mono text-[13px] font-semibold rounded py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-[12px] text-text-secondary mt-4">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
