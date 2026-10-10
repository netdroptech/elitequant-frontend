import { ArrowLeft, Plus, Trash2, CheckCircle2, Bitcoin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Crypto { id: number; symbol: string; label: string; address: string; color: string }

const CRYPTOS: Crypto[] = [
  { id: 1, symbol: 'BTC', label: 'Bitcoin',  address: 'bc1qxy2kgdygjrsqtzq2n0yrf...', color: '#f7931a' },
  { id: 2, symbol: 'ETH', label: 'Ethereum', address: '0x71C7656EC7ab88b098defB...', color: '#627eea' },
  { id: 3, symbol: 'USDT', label: 'Tether',  address: 'TQnz6fB5X7c5X5XQ5R...', color: '#26a17b' },
]

function Section({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)' }}>{title}</p>
          {sub && <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginTop: 2 }}>{sub}</p>}
        </div>
        {action}
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
      {children}
    </div>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd', cursor: 'pointer', flexShrink: 0 }}>
      <Plus size={13} /> {label}
    </button>
  )
}

export function PaymentMethods() {
  const navigate = useNavigate()

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)' }}>Payment Methods</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Manage your crypto wallets</p>
        </div>
      </div>

      {/* Limits Banner */}
      <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <CheckCircle2 size={18} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Identity Verified</p>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 55%)' }}>You have full access to all payment methods and limits.</p>
        </div>
      </div>

      {/* Crypto Wallets */}
      {/* <Section title="Crypto Wallets" sub="Deposit and withdraw using crypto addresses" action={<AddBtn onClick={() => {}} label="Add Wallet" />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CRYPTOS.map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${w.color}1a`, border: `1px solid ${w.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bitcoin size={18} style={{ color: w.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{w.label} ({w.symbol})</p>
                <p style={{ fontSize: 11, color: 'hsl(240 5% 48%)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.address}</p>
              </div>
              <button style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Trash2 size={13} style={{ color: '#f87171' }} />
              </button>
            </div>
          ))}
        </div>
      </Section> */}

      {/* Limits Overview */}
      <Section title="Transaction Limits" sub="Your current deposit and withdrawal limits">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Daily Deposit',    value: '$50,000' },
            { label: 'Daily Withdraw',   value: '$25,000' },
            { label: 'Monthly Deposit',  value: '$500,000' },
            { label: 'Monthly Withdraw', value: '$250,000' },
          ].map(l => (
            <div key={l.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 4 }}>{l.label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>{l.value}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
