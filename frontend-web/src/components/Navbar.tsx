'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Wallet, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-600))',
          borderRadius: '10px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px var(--emerald-glow)',
        }}>
          <Wallet size={20} color="#FFFFFF" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF' }}>
          Split<span style={{ color: 'var(--emerald-400)' }}>Ease</span>
        </span>
      </Link>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'var(--surface-elevated)',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.875rem',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--emerald-glow)',
              color: 'var(--emerald-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</span>
          </div>

          <button
            onClick={logout}
            className="btn btn-ghost"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            title="Sign out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/login" className="btn btn-ghost" style={{ fontSize: '0.9rem' }}>
            Sign In
          </Link>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
