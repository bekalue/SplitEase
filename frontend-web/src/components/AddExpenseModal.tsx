'use client';

import React, { useState } from 'react';
import { api, GroupMember } from '@/lib/api';
import { X, Receipt, Check, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  onClose: () => void;
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({
  isOpen,
  groupId,
  members,
  currentUserId,
  onClose,
  onExpenseAdded,
}: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState(currentUserId || (members[0]?.userId ?? ''));
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');

  // Equal split selected members
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    members.map((m) => m.userId),
  );

  // Custom split amounts per user
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = parseFloat(amount) || 0;

  // Calculate sum of custom splits
  const customSum = Object.values(customSplits).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0,
  );
  const customDiff = Math.round((totalAmount - customSum) * 100) / 100;

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length > 1) {
        setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
      }
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleCustomSplitChange = (userId: string, val: string) => {
    setCustomSplits((prev) => ({ ...prev, [userId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || totalAmount <= 0) {
      setError('Please provide a valid description and amount');
      return;
    }

    if (splitMode === 'equal' && selectedUserIds.length === 0) {
      setError('Select at least one member to split with');
      return;
    }

    if (splitMode === 'custom' && Math.abs(customDiff) > 0.01) {
      setError(`Custom splits must sum to $${totalAmount.toFixed(2)} (currently $${customSum.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (splitMode === 'equal') {
        await api.createExpense(groupId, {
          description: description.trim(),
          amount: totalAmount,
          paidById,
          splitAmongUserIds: selectedUserIds,
        });
      } else {
        const splits = Object.entries(customSplits)
          .filter(([, amt]) => parseFloat(amt) > 0)
          .map(([userId, amt]) => ({
            userId,
            amountOwed: parseFloat(amt),
          }));

        await api.createExpense(groupId, {
          description: description.trim(),
          amount: totalAmount,
          paidById,
          splits,
        });
      }

      setDescription('');
      setAmount('');
      onExpenseAdded();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to record expense');
      }
    } finally {
      setLoading(false);
    }
  };

  const perPersonEqual = selectedUserIds.length > 0 && totalAmount > 0
    ? (totalAmount / selectedUserIds.length).toFixed(2)
    : '0.00';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: 'var(--emerald-glow)',
              color: 'var(--emerald-400)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
            }}>
              <Receipt size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add an Expense</h2>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--rose-400)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dinner, Uber, Groceries, Hotel"
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total ($)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} color="var(--emerald-400)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-field"
                  style={{ paddingLeft: '2.2rem', fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Paid By</label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="select-field"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name} {m.userId === currentUserId ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split Mode Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-main)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            marginBottom: '1rem',
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              type="button"
              onClick={() => setSplitMode('equal')}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: splitMode === 'equal' ? 'var(--surface-elevated)' : 'transparent',
                color: splitMode === 'equal' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              Split Equally (${perPersonEqual}/person)
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('custom')}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                background: splitMode === 'custom' ? 'var(--surface-elevated)' : 'transparent',
                color: splitMode === 'custom' ? '#FFFFFF' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              Exact Amounts
            </button>
          </div>

          {/* Equal Split Options */}
          {splitMode === 'equal' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                Included members:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {members.map((m) => {
                  const isSelected = selectedUserIds.includes(m.userId);
                  return (
                    <button
                      type="button"
                      key={m.userId}
                      onClick={() => toggleUserSelection(m.userId)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isSelected ? 'var(--emerald-500)' : 'var(--border-medium)'}`,
                        background: isSelected ? 'var(--emerald-glow)' : 'var(--surface-elevated)',
                        color: isSelected ? 'var(--emerald-400)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {isSelected && <Check size={14} />}
                      {m.user?.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Split Options */}
          {splitMode === 'custom' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                marginBottom: '0.5rem',
                color: 'var(--text-dim)',
              }}>
                <span>Member</span>
                <span>
                  Sum: ${customSum.toFixed(2)} / ${totalAmount.toFixed(2)}{' '}
                  {Math.abs(customDiff) <= 0.01 ? (
                    <span style={{ color: 'var(--emerald-400)', fontWeight: 700 }}>(Exact match ✓)</span>
                  ) : (
                    <span style={{ color: 'var(--rose-400)', fontWeight: 700 }}>
                      (${Math.abs(customDiff).toFixed(2)} {customDiff > 0 ? 'left' : 'over'})
                    </span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {members.map((m) => (
                  <div
                    key={m.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface-elevated)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{m.user?.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={customSplits[m.userId] || ''}
                        onChange={(e) => handleCustomSplitChange(m.userId, e.target.value)}
                        style={{
                          width: '90px',
                          padding: '0.35rem 0.5rem',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-sm)',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-mono)',
                          textAlign: 'right',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || totalAmount <= 0 || !description.trim()}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
