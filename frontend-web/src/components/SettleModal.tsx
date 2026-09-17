'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';

interface Props {
  isOpen: boolean;
  groupId: string;
  toUserId: string;
  toName: string;
  defaultAmount: number;
  onClose: () => void;
  onSettled: () => void;
}

export default function SettleModal({
  isOpen,
  groupId,
  toUserId,
  toName,
  defaultAmount,
  onClose,
  onSettled,
}: Props) {
  const [amount, setAmount] = useState(defaultAmount.toFixed(2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.settleDebt(groupId, {
        toUserId,
        amount: val,
        description: `Settlement payment to ${toName}`,
      });
      onSettled();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to record settlement');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: 'var(--emerald-glow)',
              color: 'var(--emerald-400)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
            }}>
              <CheckCircle size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Record Payment</h2>
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

        <div style={{
          background: 'var(--bg-main)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          fontSize: '0.95rem',
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>You</span>
          <ArrowRight size={18} color="var(--emerald-400)" />
          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{toName}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Payment Amount ($)</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={20} color="var(--emerald-400)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.5rem', fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading || parseFloat(amount) <= 0} className="btn btn-settle">
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
