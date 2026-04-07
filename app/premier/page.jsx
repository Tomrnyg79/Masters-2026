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
      <div className="text-white py-5 px-4 shadow-lg" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🏆 Masters 2026 — Premier</h1>
            <p className="text-green-200 text-sm mt-0.5">Oppdateres automatisk ved nye registreringer</p>
          </div>
          <Link href="/" className="text-green-200 hover:text-white text-sm">← Tilbake</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Pott-oversikt */}
        <div style={{ background: AUGUSTA_GREEN, borderRadius: 12, padding: 28, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.8, marginBottom: 8 }}>
            Total premiepott
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
            {count === null ? '...' : `${pot.toLocaleString('nb-NO')} kr`}
          </div>
          <div style={{ marginTop: 12, opacity: 0.85, fontSize: 15 }}>
            {count === null ? '' : `${count} deltaker${count !== 1 ? 'e' : ''} × 200 kr`}
          </div>
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 16px', display: 'inline-block', fontSize: 13 }}>
            Potten vokser med 200 kr per nye deltaker 📈
          </div>
        </div>

        {/* Premifordeling */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Premifordeling</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PRIZES.map(prize => {
              const amount = Math.floor(pot * prize.pct);
              return (
                <div key={prize.place} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: 16, borderRadius: 10,
                  background: prize.place === 1 ? '#fffbeb' : '#f9fafb',
                  border: prize.place === 1 ? '2px solid #fde68a' : '1px solid #f3f4f6',
                }}>
                  <span style={{ fontSize: 36 }}>{prize.medal}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>{prize.label}</div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{prize.pct * 100}% av potten</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: prize.color }}>
                      {count === null ? '...' : `${amount.toLocaleString('nb-NO')} kr`}
                    </div>
                    {count !== null && count < 10 && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        ved {count} deltakere
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulator */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>📊 Hva hvis alle 35 deltar?</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>Estimat basert på 35 deltakere × 200 kr = 7 000 kr</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {PRIZES.map(prize => (
              <div key={prize.place} style={{
                flex: '1 1 140px', textAlign: 'center', padding: 16, borderRadius: 10, background: '#f9fafb'
              }}>
                <div style={{ fontSize: 24 }}>{prize.medal}</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: prize.color, marginTop: 4 }}>
                  {(7000 * prize.pct).toLocaleString('nb-NO')} kr
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{prize.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <Link href="/regler"
            style={{ color: AUGUSTA_GREEN, textDecoration: 'underline', fontSize: 14 }}>
            Les alle reglene →
          </Link>
        </div>
      </div>
    </div>
  );
}
