import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';

export default function ReglerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white shadow-lg" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(17px, 5vw, 22px)', fontWeight: 700, lineHeight: 1.2 }}>
              ⛳ Masters 2026 — Regler
            </h1>
            <p style={{ color: '#86efac', fontSize: 13, marginTop: 2 }}>Augusta National · 9–12. april 2026</p>
          </div>
          <Link href="/" style={{
            color: '#86efac', fontSize: 14, textDecoration: 'none',
            padding: '10px 12px', minHeight: 44, display: 'flex', alignItems: 'center',
            borderRadius: 8, flexShrink: 0,
          }}>← Tilbake</Link>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Slik fungerer konkurransen */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>🏌️ Slik fungerer konkurransen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '1️⃣', title: 'Velg 4 spillere', text: 'Hver deltaker velger 4 golfspillere som de ønsker å følge gjennom turneringen. I tillegg velges 1 reserve.' },
              { icon: '2️⃣', title: 'Lavest totalt antall slag vinner', text: 'Poengsummen din er summen av alle 4 spillernes totale antall slag over alle 4 runder. Lavest totalscore vinner.' },
              { icon: '3️⃣', title: 'Potten', text: 'Hver deltaker betaler 200 kr inn i potten. Premiene fordeles etter endt turnering.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4, fontSize: 15 }}>{item.title}</div>
                  <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detaljerte regler */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>📋 Detaljerte regler</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ borderLeft: `4px solid ${AUGUSTA_GREEN}`, paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6, fontSize: 15 }}>Reserve-spiller</div>
              <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                Reserven trer <strong>kun inn</strong> dersom én av dine 4 spillere trekker seg fra turneringen
                på grunn av skade eller sykdom. Reserven erstatter da den aktuelle spilleren.
                Reserven brukes <strong>ikke</strong> ved misset cut.
              </div>
            </div>

            <div style={{ borderLeft: '4px solid #ef4444', paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6, fontSize: 15 }}>🔴 Misset cut (MC)</div>
              <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                Dersom en av dine spillere ikke greier cuten etter runde 2, får den spilleren automatisk
                <strong> 79 slag</strong> for runde 3 og <strong>79 slag</strong> for runde 4.
                Dette legges til din totalscore.
              </div>
            </div>

            <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6, fontSize: 15 }}>⏰ Siste frist for valg</div>
              <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                Alle valg må være registrert <strong>før torsdag 9. april kl. 13:40</strong> —
                når den første gruppen teer av på Augusta National.
                Valg kan endres frem til denne fristen.
              </div>
            </div>

            <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6, fontSize: 15 }}>🤝 Uavgjort</div>
              <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                Ved likt antall slag deles premiepengene likt mellom de som er på samme plass.
              </div>
            </div>

          </div>
        </div>

        {/* Hvordan scoringen fungerer live */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 10 }}>📊 Slik leses stillingslisten</h2>
          <p style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>
            Augusta National er en <strong>par 72</strong>-bane — det vil si at en perfekt runde er 72 slag.
            For å gjøre stillingslisten rettferdig underveis bruker vi følgende system:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6, fontSize: 15 }}>Før turneringen starter</div>
              <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                Alle dine 4 spillere starter med <strong>72 slag per runde × 4 runder = 288 slag</strong> hver.
                Din startverdi er altså <strong>4 × 288 = 1 152 slag</strong>. Alle deltakere starter likt.
              </div>
            </div>
            <div style={{ background: '#fef9c3', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6, fontSize: 15 }}>Under turneringen (oppdateres hull for hull)</div>
              <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                Når en spiller gjør <strong>birdie</strong> (ett slag under par), trekkes 1 slag fra din total.
                En <strong>bogey</strong> legger til 1 slag. Spillere som ennå ikke har startet teller som 72 slag.
              </div>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6, fontSize: 15 }}>🔴 Misset cut</div>
              <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.6 }}>
                79 slag er <strong>7 slag over par</strong> (72 + 7 = 79). For to helgerunder betyr det
                +14 slag totalt sammenlignet med par. En spiller som misser cuten på +2 bidrar med
                288 + 2 + 14 = <strong>304 slag</strong> til din total.
              </div>
            </div>
          </div>
        </div>

        {/* Eksempel */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '20px 16px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 14 }}>❓ Eksempel — etter hele turneringen</h2>
          <div style={{ color: '#4b5563', fontSize: 15, lineHeight: 1.7 }}>
            <p>Du velger: Scottie Scheffler, Rory McIlroy, Ludvig Åberg og Jon Rahm.</p>
            <p style={{ marginTop: 10, fontWeight: 600, color: '#374151' }}>Resultat:</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>Scheffler: 68+67+69+66 = <strong>270 slag</strong></li>
              <li>McIlroy: 70+68+69+68 = <strong>275 slag</strong></li>
              <li>Åberg: <strong>misset cut</strong> → 77+72+79+79 = <strong>307 slag</strong></li>
              <li>Rahm: 71+69+70+70 = <strong>280 slag</strong></li>
            </ul>
            <div style={{ marginTop: 14, background: '#f0fdf4', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>
                Din totalscore: 270+275+307+280 = <span style={{ color: AUGUSTA_GREEN }}>1 132 slag</span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>
                1 132 − 1 152 (par) = −20 (20 under par totalt)
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', paddingTop: 4, paddingBottom: 8 }}>
          <Link href="/premier" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: AUGUSTA_GREEN, color: '#fff',
            padding: '14px 32px', borderRadius: 10, fontWeight: 600,
            fontSize: 16, textDecoration: 'none', minHeight: 50,
          }}>
            Se premieoversikt →
          </Link>
        </div>
      </div>
    </div>
  );
}
