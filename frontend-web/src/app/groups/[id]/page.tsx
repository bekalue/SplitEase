'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, Group, Expense, BalancesResult } from '@/lib/api';
import AddExpenseModal from '@/components/AddExpenseModal';
import AddMemberModal from '@/components/AddMemberModal';
import SettleModal from '@/components/SettleModal';
import {
  ArrowLeft,
  Users,
  Plus,
  Receipt,
  CheckCircle2,
  Calendar,
  UserPlus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<BalancesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members'>('expenses');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [settleData, setSettleData] = useState<{
    toUserId: string;
    toName: string;
    amount: number;
  } | null>(null);

  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    try {
      const [gData, expData, balData] = await Promise.all([
        api.getGroup(groupId),
        api.getExpenses(groupId),
        api.getBalances(groupId),
      ]);
      setGroup(gData);
      setExpenses(expData);
      setBalances(balData);
    } catch {
      // Group might not exist or user not a member
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
    // Auto-polling every 8 seconds for live sync
    const interval = setInterval(fetchGroupData, 8000);
    return () => clearInterval(interval);
  }, [fetchGroupData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw className="animate-spin" size={32} color="var(--emerald-400)" />
          <p style={{ color: 'var(--text-muted)' }}>Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ maxWidth: '600px', margin: '5rem auto', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Group not found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          This group doesn't exist or you are not an authorized member.
        </p>
        <Link href="/" className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Calculate total group spend
  const totalGroupSpend = expenses.reduce((sum, e) => {
    const isSettlement = e.description.toLowerCase().includes('settlement');
    return isSettlement ? sum : sum + Number(e.amount);
  }, 0);

  // Current user's balance in this group
  const myBalance = balances?.balances.find((b) => b.userId === user?.id);
  const myNet = myBalance?.netBalance ?? 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Back link & Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/" className="btn btn-ghost" style={{ paddingLeft: '0.25rem' }}>
          <ArrowLeft size={18} /> Back to All Groups
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => { setRefreshing(true); fetchGroupData(); }}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Sync'}
          </button>
          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
          >
            <UserPlus size={14} /> Add Member
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Group Header Hero Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-600))',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px var(--emerald-glow)',
              }}>
                <Users size={22} />
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{group.name}</h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span>{group.members.length} members</span>
              <span>•</span>
              <span>${totalGroupSpend.toFixed(2)} total shared expenses</span>
            </div>
          </div>

          {/* User Net in this group */}
          <div style={{
            background: 'var(--surface-elevated)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-medium)',
            minWidth: '220px',
            textAlign: 'right',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              Your Net Balance
            </span>
            <div style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              marginTop: '0.2rem',
              color: myNet > 0.005 ? 'var(--emerald-400)' : myNet < -0.005 ? 'var(--rose-400)' : 'var(--text-main)',
            }}>
              {myNet > 0.005 ? `+$${myNet.toFixed(2)}` : myNet < -0.005 ? `-$${Math.abs(myNet).toFixed(2)}` : '$0.00'}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {myNet > 0.005 ? 'You are owed' : myNet < -0.005 ? 'You owe' : 'Fully settled up'}
            </span>
          </div>
        </div>

        {/* Members chips bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginRight: '0.5rem' }}>Members:</span>
          {group.members.map((m) => {
            const isMe = m.userId === user?.id;
            return (
              <div
                key={m.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: isMe ? 'var(--emerald-glow)' : 'var(--surface-elevated)',
                  border: `1px solid ${isMe ? 'var(--emerald-500)' : 'var(--border-subtle)'}`,
                  fontSize: '0.85rem',
                  fontWeight: isMe ? 700 : 500,
                  color: isMe ? 'var(--emerald-400)' : 'var(--text-main)',
                }}
              >
                <span>{m.user?.name}</span>
                {isMe && <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(You)</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
        gap: '2rem',
      }}>
        <button
          onClick={() => setActiveTab('expenses')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'expenses' ? '2px solid var(--emerald-400)' : '2px solid transparent',
            color: activeTab === 'expenses' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0.75rem 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Receipt size={18} />
          Expenses ({expenses.length})
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'balances' ? '2px solid var(--emerald-400)' : '2px solid transparent',
            color: activeTab === 'balances' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0.75rem 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <TrendingUp size={18} />
          Balances & Settle Up ({balances?.settlements.length || 0} debts)
        </button>

        <button
          onClick={() => setActiveTab('members')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'members' ? '2px solid var(--emerald-400)' : '2px solid transparent',
            color: activeTab === 'members' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1rem',
            padding: '0.75rem 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Users size={18} />
          Members ({group.members.length})
        </button>
      </div>

      {/* Tab 1: Expenses List */}
      {activeTab === 'expenses' && (
        <div>
          {expenses.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Receipt size={40} color="var(--text-dim)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Expenses Added</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Add your group dinner, groceries, flights, or tickets to start splitting.
              </p>
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn btn-primary">
                <Plus size={16} /> Add First Expense
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {expenses.map((expense) => {
                const isSettlement = expense.description.toLowerCase().includes('settlement');
                const date = new Date(expense.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={expense.id}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      borderLeft: isSettlement ? '4px solid var(--emerald-500)' : '4px solid #3B82F6',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{
                        background: isSettlement ? 'var(--emerald-glow)' : 'rgba(59, 130, 246, 0.15)',
                        color: isSettlement ? 'var(--emerald-400)' : '#60A5FA',
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isSettlement ? <CheckCircle2 size={22} /> : <Receipt size={22} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{expense.description}</h4>
                          {isSettlement && (
                            <span className="badge badge-positive" style={{ fontSize: '0.7rem' }}>
                              Payment
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          <span>
                            Paid by <strong style={{ color: 'var(--text-main)' }}>{expense.paidBy?.name || 'Member'}</strong>
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={14} /> {date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: isSettlement ? 'var(--emerald-400)' : '#FFFFFF',
                      }}>
                        ${Number(expense.amount).toFixed(2)}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Split among {expense.splits.length} {expense.splits.length === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Balances & Simplified Settlement */}
      {activeTab === 'balances' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          {/* Net Balances Column */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Group Net Balances
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {balances?.balances.map((b) => {
                const isPositive = b.netBalance > 0.005;
                const isNegative = b.netBalance < -0.005;
                const isMe = b.userId === user?.id;

                return (
                  <div
                    key={b.userId}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: isPositive
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isNegative
                            ? 'rgba(244, 63, 94, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        color: isPositive ? 'var(--emerald-400)' : isNegative ? 'var(--rose-400)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}>
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {b.name} {isMe && <span style={{ color: 'var(--emerald-400)', fontSize: '0.8rem' }}>(You)</span>}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {isPositive ? 'is owed money' : isNegative ? 'owes money' : 'settled'}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: isPositive ? 'var(--emerald-400)' : isNegative ? 'var(--rose-400)' : 'var(--text-dim)',
                    }}>
                      {isPositive ? `+$${b.netBalance.toFixed(2)}` : isNegative ? `-$${Math.abs(b.netBalance).toFixed(2)}` : '$0.00'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simplified Debt Settlement Plan Column */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Simplified Debt Settlement
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Algorithmic graph reduction down to the fewest payments needed to square everyone up:
              </p>
            </div>

            {balances?.settlements.length === 0 ? (
              <div className="glass-card" style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.05)',
              }}>
                <CheckCircle2 size={48} color="var(--emerald-400)" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>
                  All Debts Settled! 🎉
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Everyone in this group is completely even. No payments are required.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {balances?.settlements.map((s, idx) => {
                  const isMyDebt = s.fromUserId === user?.id;

                  return (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        padding: '1.15rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: isMyDebt ? '1px solid var(--amber-500)' : '1px solid var(--border-subtle)',
                        background: isMyDebt ? 'rgba(245, 158, 11, 0.06)' : 'var(--surface-card)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--amber-400)',
                          padding: '0.4rem',
                          borderRadius: '8px',
                        }}>
                          <ArrowRight size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                            <span style={{ color: isMyDebt ? 'var(--amber-400)' : '#FFFFFF' }}>
                              {s.fromName} {isMyDebt ? '(You)' : ''}
                            </span>
                            {' '}pays{' '}
                            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                              {s.toName}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--emerald-400)',
                            marginTop: '0.15rem',
                          }}>
                            ${s.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSettleData({
                          toUserId: s.toUserId,
                          toName: s.toName,
                          amount: s.amount,
                        })}
                        className="btn btn-settle"
                      >
                        Settle Up
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Members Directory */}
      {activeTab === 'members' && (
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Group Members</h3>
            <button onClick={() => setIsMemberModalOpen(true)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <UserPlus size={16} /> Add Member
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {group.members.map((m) => {
              const isMe = m.userId === user?.id;
              return (
                <div
                  key={m.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--emerald-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}>
                      {m.user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {m.user?.name}
                        {isMe && <span className="badge badge-positive" style={{ fontSize: '0.65rem' }}>You</span>}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {m.user?.email}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        groupId={groupId}
        members={group.members}
        currentUserId={user?.id || ''}
        onClose={() => setIsExpenseModalOpen(false)}
        onExpenseAdded={fetchGroupData}
      />

      <AddMemberModal
        isOpen={isMemberModalOpen}
        groupId={groupId}
        onClose={() => setIsMemberModalOpen(false)}
        onMemberAdded={fetchGroupData}
      />

      {settleData && (
        <SettleModal
          isOpen={true}
          groupId={groupId}
          toUserId={settleData.toUserId}
          toName={settleData.toName}
          defaultAmount={settleData.amount}
          onClose={() => setSettleData(null)}
          onSettled={fetchGroupData}
        />
      )}
    </div>
  );
}
