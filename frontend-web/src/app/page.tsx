'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, Group, BalancesResult } from '@/lib/api';
import CreateGroupModal from '@/components/CreateGroupModal';
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  RefreshCw,
  Wallet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Group balances map: groupId -> BalancesResult
  const [balancesMap, setBalancesMap] = useState<Record<string, BalancesResult>>({});

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedGroups = await api.getGroups();
      setGroups(fetchedGroups);

      // Load balances for each group to compute overall net
      const balancesPromises = fetchedGroups.map(async (g) => {
        try {
          const res = await api.getBalances(g.id);
          return { groupId: g.id, res };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(balancesPromises);
      const newMap: Record<string, BalancesResult> = {};
      results.forEach((item) => {
        if (item) newMap[item.groupId] = item.res;
      });
      setBalancesMap(newMap);
    } catch {
      // User might be logged out or network error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, loadData]);

  // Compute aggregate net balance for the user across all groups
  let totalNet = 0;
  if (user) {
    Object.values(balancesMap).forEach((bRes) => {
      const myBal = bRes.balances.find((b) => b.userId === user.id);
      if (myBal) {
        totalNet += myBal.netBalance;
      }
    });
  }
  totalNet = Math.round(totalNet * 100) / 100;

  if (authLoading || (loading && user)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--emerald-400)" />
          <p style={{ color: 'var(--text-muted)' }}>Loading your expense groups...</p>
        </div>
      </div>
    );
  }

  // Logged-out Landing Hero
  if (!user) {
    return (
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '5rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-medium)',
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-full)',
          marginBottom: '2rem',
          fontSize: '0.85rem',
          color: 'var(--emerald-400)',
          fontWeight: 600,
        }}>
          <SparklesIcon size={16} /> Effortless Shared Expense Tracking
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '1.5rem',
        }}>
          Split bills with friends.<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--emerald-400), var(--emerald-600))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Zero awkward debt math.
          </span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-muted)',
          maxWidth: '640px',
          margin: '0 auto 2.5rem auto',
          lineHeight: 1.6,
        }}>
          SplitEase automatically calculates who owes whom and optimizes payments down to the fewest transactions possible. Built for trips, roommates, and group dinners.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
            Sign In
          </Link>
        </div>

        {/* Feature Cards Showcase */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '5rem',
          textAlign: 'left',
        }}>
          <div className="glass-card">
            <div style={{
              background: 'var(--emerald-glow)',
              color: 'var(--emerald-400)',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Smart Debt Minimization</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Algorithms greedily match debtors and creditors, reducing 10 tangled IOUs into 2 simple payments.
            </p>
          </div>

          <div className="glass-card">
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--indigo-500)',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Multi-Platform Sync</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Add an expense on the Next.js web dashboard or on the Flutter mobile app — balances sync in real time.
            </p>
          </div>

          <div className="glass-card">
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--amber-400)',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Wallet size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>1-Click Settle Up</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Record cash, Venmo, or bank settlements with one tap to immediately zero out outstanding balances.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Dashboard
  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Top Banner & Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
      }}>
        {/* Welcome Card */}
        <div className="glass-panel" style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal Dashboard
            </span>
            <h1 style={{ fontSize: '1.85rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              Welcome back, {user.name}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              You are a member of {groups.length} active expense {groups.length === 1 ? 'group' : 'groups'}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
              <Plus size={18} /> New Group
            </button>
            <button
              onClick={() => { setRefreshing(true); loadData(); }}
              disabled={refreshing}
              className="btn btn-secondary"
              title="Refresh balances"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Total Net Balance Card */}
        <div className="glass-panel" style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: totalNet > 0.005
            ? '4px solid var(--emerald-500)'
            : totalNet < -0.005
              ? '4px solid var(--rose-500)'
              : '4px solid var(--border-medium)',
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Net Position
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: totalNet > 0.005
                  ? 'var(--emerald-400)'
                  : totalNet < -0.005
                    ? 'var(--rose-400)'
                    : 'var(--text-main)',
              }}>
                {totalNet > 0.005 ? `+$${totalNet.toFixed(2)}` : totalNet < -0.005 ? `-$${Math.abs(totalNet).toFixed(2)}` : '$0.00'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              {totalNet > 0.005
                ? 'Across all groups, people owe you in total.'
                : totalNet < -0.005
                  ? 'Across all groups, you owe others in total.'
                  : 'You are completely even across all groups.'}
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '1.25rem',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: totalNet > 0.005
              ? 'rgba(16, 185, 129, 0.15)'
              : totalNet < -0.005
                ? 'rgba(244, 63, 94, 0.15)'
                : 'rgba(148, 163, 184, 0.15)',
            color: totalNet > 0.005
              ? 'var(--emerald-400)'
              : totalNet < -0.005
                ? 'var(--rose-400)'
                : 'var(--text-muted)',
            width: 'fit-content',
          }}>
            {totalNet > 0.005 ? (
              <><ArrowDownLeft size={14} /> Overall Creditor</>
            ) : totalNet < -0.005 ? (
              <><ArrowUpRight size={14} /> Overall Debtor</>
            ) : (
              <><CheckCircle2 size={14} /> Settled Up</>
            )}
          </div>
        </div>
      </div>

      {/* Groups Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Your Groups</h2>
      </div>

      {groups.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--surface-elevated)',
            padding: '1rem',
            borderRadius: '50%',
            marginBottom: '1rem',
            color: 'var(--text-dim)',
          }}>
            <Users size={36} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Groups Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            Create your first group for an upcoming trip, shared apartment, or project to begin splitting bills.
          </p>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Create a Group
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.25rem',
        }}>
          {groups.map((group) => {
            const bRes = balancesMap[group.id];
            const myBal = bRes?.balances.find((b) => b.userId === user.id);
            const myNet = myBal?.netBalance ?? 0;

            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{group.name}</h3>
                    <span className={`badge ${myNet > 0.005 ? 'badge-positive' : myNet < -0.005 ? 'badge-negative' : 'badge-neutral'}`}>
                      {myNet > 0.005 ? `+$${myNet.toFixed(2)}` : myNet < -0.005 ? `-$${Math.abs(myNet).toFixed(2)}` : 'Settled'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <Users size={16} color="var(--emerald-400)" />
                    <span>{group.members.length} {group.members.length === 1 ? 'member' : 'members'}</span>
                  </div>
                </div>

                <div style={{
                  marginTop: '1.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                    {group.members.slice(0, 4).map((m, idx) => (
                      <div
                        key={m.id}
                        title={m.user?.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--surface-elevated)',
                          border: '2px solid var(--bg-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: idx === 0 ? '0' : '-8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--emerald-400)',
                        }}
                      >
                        {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    ))}
                    {group.members.length > 4 && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--surface-elevated)',
                        border: '2px solid var(--bg-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '-8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                      }}>
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>

                  <span style={{ color: 'var(--emerald-400)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    View Details <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={(newGroup) => {
          setGroups([newGroup, ...groups]);
          router.push(`/groups/${newGroup.id}`);
        }}
      />
    </div>
  );
}

function SparklesIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.912 4.688L18.6 9.6l-4.688 1.912L12 16.2l-1.912-4.688L5.4 9.6l4.688-1.912z" />
    </svg>
  );
}
