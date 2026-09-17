'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, UserPlus, Mail } from 'lucide-react';

interface Props {
  isOpen: boolean;
  groupId: string;
  onClose: () => void;
  onMemberAdded: () => void;
}

export default function AddMemberModal({ isOpen, groupId, onClose, onMemberAdded }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.addMember(groupId, email.trim());
      setEmail('');
      onMemberAdded();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add member');
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
              <UserPlus size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add Member</h2>
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
          <div className="form-group">
            <label className="form-label">Member Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="input-field"
                style={{ paddingLeft: '2.75rem' }}
                required
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
              The user must already have a SplitEase account registered with this email.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={loading || !email.trim()} className="btn btn-primary">
              {loading ? 'Adding...' : 'Add to Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
