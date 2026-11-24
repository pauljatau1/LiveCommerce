import { Component, ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AREA_LABELS, areaForPath, useAccess } from '@/config/access';

// A page that crashes shows a plain message with Retry instead of a blank screen.
class Boundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error('[admin] page crashed', error); }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false }); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <h2 className="text-lg font-semibold text-white">This page hit a problem</h2>
        <p className="mt-2 text-sm text-zinc-400">Nothing was changed. Try again, or go back to the dashboard.</p>
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white" onClick={() => window.location.reload()}>Retry</button>
          <a className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200" href="/dashboard">Dashboard</a>
        </div>
      </div>
    );
  }
}

// When the server can't be reached or a page's data fails to load, say so once, with Retry.
function LoadProblem() {
  const [problem, setProblem] = useState('');
  const location = useLocation();
  useEffect(() => setProblem(''), [location.pathname]);
  useEffect(() => {
    const onFail = (e: Event) => setProblem((e as CustomEvent<string>).detail);
    window.addEventListener('admin:load-failed', onFail);
    return () => window.removeEventListener('admin:load-failed', onFail);
  }, []);
  if (!problem) return null;
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <span>{problem}</span>
      <button type="button" className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-medium" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}

// A page outside this admin's access says so, instead of loading and failing.
function NoAccess({ area }: { area: string }) {
  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
      <h2 className="text-lg font-semibold text-white">You don't have access to {AREA_LABELS[area] || 'this page'}</h2>
      <p className="mt-2 text-sm text-zinc-400">Ask a super admin to add it to your access.</p>
    </div>
  );
}

export default function PageGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { can, access } = useAccess();
  const area = areaForPath(location.pathname);
  if (access && !can(area)) return <NoAccess area={area} />;
  return <><LoadProblem /><Boundary resetKey={location.pathname}>{children}</Boundary></>;
}
