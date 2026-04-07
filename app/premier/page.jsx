'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';
const ENTRY_FEE = 200;

const PRIZES = [
  { place: 1, pct: 0.50, medal: '🥇', label: '1. plass', color: '#d97706' },
  { place: 2, pct: 0.30, medal: '🥈', label: '2. plass', color: '#6b7280' },
  { place: 3, pct: 0.20, medal: '🥉', label: '3. plass', color: '#92400e' },
];

export default function PremierPage() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    fetch('/api/allpicks')
      .then(r => r.json())
      .then(d => setCount((d.participants || []).length));
  }, []);

  const pot = (count || 0) * ENTRY_FEE;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white shadow-lg" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(17px, 5vw, 22px)', fontWeight: 700, lineHeight: 1.2 }}>
              🏆 Masters 2026 — Premier
            </h1>
            <p style={{ color: '#86efac', fontSize: 13, marginTop: 2 }}>Oppdateres automatisk ved nye registreringer</p>
          </div>
          <Link href="/" style={{
            color: '#86efac', fontSize: 14, textDecoration: 'none',
            padding: '10px 12px', minHeight: 44, display: 'flex', alignItems: 'center',
            borderRadius: 8, flexShrink: 0,
          }}>← Tilbake</Link>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Pott-oversikt */}
        <div style={{
          background: AUGUSTA_GREEN, borderRadius: 12, padding: '28px 20px',
          textAlign: 'center', color: '#fff',
        }}>
          <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8, marginBottom: 10 }}>
            Total premiepott
          </div>
          <div style={{
            fontSize: 'clamp(36px, 12vw, 60px)',
            fontWeight: 800, lineHeight: 1, letterSpacing: -1,
          }}>
            {count === null ? '...' : `${pot.toLocaleString('nb-NO')} kr`}
          </div>
          <div style={{ marginTop: 12, opacity: 0.85, fontSize: 16 }}>
            {count === null ? '' : `${count} deltaker${count !== 1 ? 'e' : ''} × 200 kr`}
          </div>
          <div style={{
            marginTop: 16, background: 'rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '10px 16px', display: 'inline-block', fontSize: 14,
          }}>
            Potten vokser med 200 kr per nye deltaker 📈
          </div>
        </div>

        {/* Premifordeling */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Premifordeling</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PRIZES.map(prize => {
              const amount = Math.floor(pot * prize.pct);
              return (
                <div key={prize.place} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 14px', borderRadius: 10,
                  background: prize.place === 1 ? '#fffbeb' : '#f9fafb',
                  border: prize.place === 1 ? '2px solid #fde68a' : '1px solid #f3f4f6',
                }}>
                  <span style={{ fontSize: 38, flexShrink: 0, lineHeight: 1 }}>{prize.medal}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>{prize.label}</div>
                    <div style={{ color: '#6b7280', fontSize: 14, marginTop: 2 }}>{prize.pct * 100}% av potten</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 'clamp(20px, 6vw, 28px)',
                      fontWeight: 800, color: prize.color, lineHeight: 1,
                    }}>
                      {count === null ? '...' : `${amount.toLocaleString('nb-NO')} kr`}
                    </div>
                    {count !== null && count < 10 && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        ved {count} deltakere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <Link href="/regler" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: AUGUSTA_GREEN, textDecoration: 'underline', fontSize: 15,
            padding: '12px 16px', minHeight: 44,
          }}>
            Les alle reglene →
          </Link>
        </div>
      </div>
    </div>
  );
}
