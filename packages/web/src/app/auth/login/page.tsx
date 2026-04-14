'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loadTeams } = useAuth();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(emailOrUsername, password);
      const teams = await loadTeams();
      if (teams.length > 0) {
        router.push('/app');
      } else {
        router.push('/auth/onboarding');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-9 w-[380px] max-w-[90vw]">
      <div className="font-mono font-bold text-[22px] text-text">
        notnow<span className="text-text-tertiary">.</span>
      </div>
      <p className="text-[13px] text-text-secondary mb-7">Welcome back.</p>

      <form onSubmit={onSubmit}>
        <label className="block font-mono text-[11px] font-medium text-text-secondary tracking-wide mb-1">
          Email or @username
        </label>
        <input
          type="text"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
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
        />

        {error && <p className="text-red text-[12px] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg font-mono text-[13px] font-semibold rounded py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-[12px] text-text-secondary mt-4">
        No account?{' '}
        <Link href="/auth/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
