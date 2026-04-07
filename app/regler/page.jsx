import Link from 'next/link';

const AUGUSTA_GREEN = '#006747';

export default function ReglerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white py-5 px-4 shadow-lg" style={{ backgroundColor: AUGUSTA_GREEN }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⛳ Masters 2026 — Regler</h1>
            <p className="text-green-200 text-sm mt-0.5">Augusta National · 9–12. april 2026</p>
          </div>
          <Link href="/" className="text-green-200 hover:text-white text-sm">← Tilbake</Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>🏌️ Slik fungerer konkurransen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '1️⃣', title: 'Velg 4 spillere', text: 'Hver deltaker velger 4 golfspillere som de ønsker å følge gjennom turneringen. I tillegg velges 1 reserve.' },
              { icon: '2️⃣', title: 'Lavest totalt antall slag vinner', text: 'Poengsummen din er summen av alle 4 spillernes totale antall slag over alle 4 runder. Lavest totalscore vinner.' },
              { icon: '3️⃣', title: 'Potten', text: 'Hver deltaker betaler 200 kr inn i potten. Premiene fordeles etter endt turnering.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>📋 Detaljerte regler</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ borderLeft: `4px solid ${AUGUSTA_GREEN}`, paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>Reserve-spiller</div>
              <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                Reserven trer <strong>kun inn</strong> dersom én av dine 4 spillere trekker seg fra turneringen
                på grunn av skade eller sykdom. Reserven erstatter da den aktuelle spilleren.
                Reserven brukes <strong>ikke</strong> ved misset cut.
              </div>
            </div>

            <div style={{ borderLeft: `4px solid #ef4444`, paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>🔴 Misset cut (MC)</div>
              <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                Dersom en av dine spillere ikke greier cuten etter runde 2, får den spilleren automatisk
                <strong> 79 slag</strong> for runde 3 og <strong>79 slag</strong> for runde 4.
                Dette legges til din totalscore.
              </div>
            </div>

            <div style={{ borderLeft: `4px solid #f59e0b`, paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>⏰ Siste frist for picks</div>
              <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                Alle picks må være registrert <strong>før torsdag 9. april kl. 09:00</strong> —
                når den første gruppen teer av på Augusta National.
                Picks kan endres frem til denne fristen.
              </div>
            </div>

            <div style={{ borderLeft: `4px solid #6366f1`, paddingLeft: 16 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>🤝 Uavgjort</div>
              <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                Ved likt antall slag deles premiepengene likt mellom de som er på samme plass.
              </div>
            </div>

          </div>
        </div>

        {/* Hvordan scoringen fungerer live */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>📊 Slik leses stillingslisten</h2>
          <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Augusta National er en <strong>par 72</strong>-bane — det vil si at en perfekt runde er 72 slag.
            For å gjøre stillingslisten rettferdig underveis i turneringen bruker vi følgende system:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>Før turneringen starter</div>
              <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                Alle dine 4 spillere starter med <strong>72 slag per runde × 4 runder = 288 slag</strong> hver.
                Din startverdi er altså <strong>4 × 288 = 1 152 slag</strong>. Alle deltakere starter likt.
              </div>
            </div>
            <div style={{ background: '#fef9c3', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>Under turneringen (oppdateres hull for hull)</div>
              <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                Når en spiller gjør <strong>birdie</strong> (ett slag under par), trekkes 1 slag fra din total.
                En <strong>bogey</strong> legger til 1 slag. Spillere som ennå ikke har startet teller fortsatt
                som 72 slag — ingen er kunstig «foran» fordi de ikke har spilt ennå.
              </div>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>🔴 Misset cut</div>
              <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.6 }}>
                79 slag er <strong>7 slag over par</strong> (72 + 7 = 79). For to helgerunder betyr det
                +14 slag totalt sammenlignet med par. En spiller som misser cuten på +2 bidrar med
                288 + 2 + 14 = <strong>304 slag</strong> til din total.
              </div>
            </div>
          </div>
        </div>

        {/* Eksempel */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>❓ Eksempel — etter hele turneringen</h2>
          <div style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.8 }}>
            <p>Du velger: Scottie Scheffler, Rory McIlroy, Ludvig Åberg og Jon Rahm.</p>
            <p style={{ marginTop: 8 }}>Resultat:</p>
            <ul style={{ marginTop: 4, paddingLeft: 20, listStyleType: 'disc' }}>
              <li>Scheffler: 68+67+69+66 = <strong>270 slag</strong></li>
              <li>McIlroy: 70+68+69+68 = <strong>275 slag</strong></li>
              <li>Åberg: <strong>misset cut</strong> → 77+72 + 79+79 = <strong>307 slag</strong></li>
              <li>Rahm: 71+69+70+70 = <strong>280 slag</strong></li>
            </ul>
            <div style={{ marginTop: 12, background: '#f0fdf4', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, color: '#111827' }}>
                Din totalscore: 270 + 275 + 307 + 280 = <span style={{ color: AUGUSTA_GREEN }}>1 132 slag</span>
              </div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                1 132 − 1 152 (par) = −20 (20 under par totalt)
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <Link href="/premier"
            style={{ display: 'inline-block', background: AUGUSTA_GREEN, color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>
            Se premieoversikt →
          </Link>
        </div>
      </div>
    </div>
  );
}
