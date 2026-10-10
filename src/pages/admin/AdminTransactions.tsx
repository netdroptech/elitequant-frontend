import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Filter, CheckCircle2, X, Clock, ChevronRight, RefreshCw, ImageIcon, ExternalLink, Copy, Check, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { adminApi } from '@/lib/api'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace('/api', '')

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id:          string
  type:        string
  amount:      number
  status:      string
  userId?:     string
  txHash?:     string
  note?:       string
  adminNote?:  string
  proofUrl?:   string
  network?:       string
  walletAddress?: string
  createdAt:   string
  completedAt?: string
  user: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
  }
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { c: string; bg: string; label: string }> = {
  DEPOSIT:    { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  label: 'Deposit'    },
  WITHDRAWAL: { c: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Withdrawal' },
  PROFIT:     { c: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Profit'     },
  BONUS:      { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Bonus'      },
}

const STATUS_META: Record<string, { c: string; bg: string; label: string; icon: React.ElementType }> = {
  COMPLETED:  { c: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  label: 'Completed',  icon: CheckCircle2 },
  PENDING:    { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Pending',    icon: Clock        },
  PROCESSING: { c: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Processing', icon: Clock        },
  REJECTED:   { c: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Rejected',   icon: X            },
  CANCELLED:  { c: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Cancelled',  icon: X            },
}

function filterBtn(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border:  active ? '1px solid rgba(167,139,250,0.35)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
    color:   active ? '#c4b5fd' : 'hsl(240 5% 55%)',
  }
}

function avatarColor(email: string) {
  const cols = ['#a78bfa','#60a5fa','#a78bfa','#f59e0b','#f87171','#a78bfa']
  let h = 0; for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return cols[h % cols.length]
}

// ─── Proof Image Modal ────────────────────────────────────────────────────────

function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 680, width: '100%', background: 'hsl(260 60% 5%)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>Payment Proof</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={fullUrl} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 60%)', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
              <ExternalLink size={11} /> Open
            </a>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
        </div>
        {/* Image */}
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)' }}>
          <img src={fullUrl} alt="Payment proof" style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8, display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Destination / Wallet Address Cell ────────────────────────────────────────
// Shows where a withdrawal is being sent. For crypto withdrawals this is the
// wallet address (with the network/coin label above it); for other methods
// (e.g. bank/wire) it falls back to the details captured in the note.
// Includes a one-click copy button so admins can paste the address into their
// wallet when processing the payout.

function DestinationCell({ tx }: { tx: Transaction }) {
  const [copied, setCopied] = useState(false)

  // Only withdrawals have a payout destination.
  if (tx.type !== 'WITHDRAWAL') {
    return <span style={{ fontSize: 11, color: 'hsl(240 5% 38%)' }}>—</span>
  }

  const address = (tx.walletAddress ?? '').trim()
  // Fallback for non-crypto methods where the destination lives in the note.
  const display = address || (tx.note ?? '').trim()

  if (!display) {
    return <span style={{ fontSize: 11, color: 'hsl(240 5% 38%)' }}>—</span>
  }

  const copy = () => {
    const text = address || display
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
      .catch(() => { /* clipboard blocked — silently ignore */ })
  }

  return (
    <div style={{ maxWidth: 220 }}>
      {tx.network && (
        <p style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
          {tx.network}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          title={address || display}
          style={{ fontSize: 11, fontFamily: 'monospace', color: 'hsl(40 6% 78%)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {address || display}
        </span>
        {address && (
          <button
            onClick={copy}
            title={copied ? 'Copied!' : 'Copy address'}
            style={{ width: 22, height: 22, borderRadius: 5, background: copied ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#a78bfa' : 'hsl(240 5% 55%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Add / Edit / Delete (admin CRUD for deposits & withdrawals) ─────────────

interface UserOption { id: string; fullName: string; email: string }

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 50%)', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }
const fieldInput: React.CSSProperties = { width: '100%', height: 38, padding: '0 11px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 90%)', outline: 'none', boxSizing: 'border-box' }
const optBg: React.CSSProperties = { background: 'hsl(260 87% 6%)' }

function toLocalInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ModalShell({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: width, background: 'hsl(260 60% 5%)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'hsl(40 6% 92%)' }}>{title}</p>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(240 5% 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  )
}

function AdjustBalanceToggle({ checked, onChange, hint }: { checked: boolean; onChange: (v: boolean) => void; hint: string }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '11px 13px', borderRadius: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ marginTop: 2, accentColor: '#7c3aed' }} />
      <span>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'hsl(40 6% 88%)' }}>Adjust user's balance</span>
        <span style={{ display: 'block', fontSize: 11, color: 'hsl(240 5% 52%)', marginTop: 2 }}>{hint}</span>
      </span>
    </label>
  )
}

function TxFormModal({ tx, defaultType, onClose, onSaved }: {
  tx: Transaction | null
  defaultType: 'DEPOSIT' | 'WITHDRAWAL'
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!tx
  const [users, setUsers]       = useState<UserOption[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')
  const [adjust, setAdjust]     = useState(true)
  const [form, setForm] = useState({
    userId:        tx?.user?.id ?? tx?.userId ?? '',
    type:          (tx?.type as 'DEPOSIT' | 'WITHDRAWAL') ?? defaultType,
    amount:        tx ? String(tx.amount) : '',
    status:        tx?.status ?? 'COMPLETED',
    createdAt:     toLocalInput(tx?.createdAt),
    network:       tx?.network ?? '',
    walletAddress: tx?.walletAddress ?? '',
    txHash:        tx?.txHash ?? '',
    note:          tx?.note ?? '',
    adminNote:     tx?.adminNote ?? '',
  })

  useEffect(() => {
    adminApi.get<{ success: boolean; data: UserOption[] }>('/admin/property-investments/users')
      .then(r => setUsers(r.data ?? []))
      .catch(() => setErr('Could not load users.'))
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const q = userQuery.trim().toLowerCase()
  const userOptions = users.filter(u => !q || u.id === form.userId || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))

  async function save() {
    setErr('')
    if (!form.userId) return setErr('Select a user.')
    if (!(Number(form.amount) > 0)) return setErr('Enter an amount greater than 0.')
    setSaving(true)
    try {
      const body = {
        ...form,
        amount: Number(form.amount),
        createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined,
        adjustBalance: adjust,
      }
      if (isEdit) await adminApi.put(`/admin/transactions/${tx!.id}`, body)
      else        await adminApi.post('/admin/transactions', body)
      onSaved(isEdit ? 'Transaction updated.' : 'Transaction created.')
    } catch (e: any) {
      setErr(e?.message ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={fieldLabel}>User</label>
          <input style={{ ...fieldInput, marginBottom: 6 }} value={userQuery} onChange={e => setUserQuery(e.target.value)} placeholder="Search name or email…" />
          <select style={fieldInput} value={form.userId} onChange={set('userId')}>
            <option value="" style={optBg}>{users.length ? 'Select a user' : 'Loading users…'}</option>
            {userOptions.map(u => <option key={u.id} value={u.id} style={optBg}>{u.fullName} — {u.email}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label style={fieldLabel}>Type</label>
            <select style={fieldInput} value={form.type} onChange={set('type')}>
              <option value="DEPOSIT" style={optBg}>Deposit</option>
              <option value="WITHDRAWAL" style={optBg}>Withdrawal</option>
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Amount (USD)</label>
            <input style={fieldInput} type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
          </div>
          <div>
            <label style={fieldLabel}>Status</label>
            <select style={fieldInput} value={form.status} onChange={set('status')}>
              {['COMPLETED', 'PENDING', 'PROCESSING', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s} style={optBg}>{STATUS_META[s]?.label ?? s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label style={fieldLabel}>Date</label>
            <input style={fieldInput} type="datetime-local" value={form.createdAt} onChange={set('createdAt')} />
          </div>
          <div>
            <label style={fieldLabel}>Network / Method</label>
            <input style={fieldInput} value={form.network} onChange={set('network')} placeholder="USDT (TRC20)" />
          </div>
        </div>

        <div>
          <label style={fieldLabel}>Wallet Address</label>
          <input style={{ ...fieldInput, fontFamily: 'monospace' }} value={form.walletAddress} onChange={set('walletAddress')} placeholder="Optional" />
        </div>
        <div>
          <label style={fieldLabel}>Transaction Hash</label>
          <input style={{ ...fieldInput, fontFamily: 'monospace' }} value={form.txHash} onChange={set('txHash')} placeholder="Optional" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label style={fieldLabel}>Note (visible to user)</label>
            <input style={fieldInput} value={form.note} onChange={set('note')} placeholder="Optional" />
          </div>
          <div>
            <label style={fieldLabel}>Admin Note</label>
            <input style={fieldInput} value={form.adminNote} onChange={set('adminNote')} placeholder="Optional" />
          </div>
        </div>

        <AdjustBalanceToggle checked={adjust} onChange={setAdjust}
          hint={isEdit
            ? "Updates the user's balance and deposit/withdrawal totals by the difference this edit makes."
            : "Completed deposits add to the balance; pending or completed withdrawals deduct from it."} />

        {err && <p style={{ fontSize: 12, color: '#f87171' }}>{err}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 58%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
            {isEdit ? 'Save Changes' : 'Create Transaction'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function DeleteTxModal({ tx, onClose, onDeleted }: { tx: Transaction; onClose: () => void; onDeleted: (msg: string) => void }) {
  const [adjust, setAdjust] = useState(true)
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')

  async function confirm() {
    setBusy(true); setErr('')
    try {
      await adminApi.delete(`/admin/transactions/${tx.id}?adjustBalance=${adjust}`)
      onDeleted('Transaction deleted.')
    } catch (e: any) {
      setErr(e?.message ?? 'Delete failed.')
    } finally { setBusy(false) }
  }

  return (
    <ModalShell title="Delete Transaction" onClose={onClose} width={440}>
      <p style={{ fontSize: 13, color: 'hsl(40 6% 82%)', marginBottom: 14, lineHeight: 1.5 }}>
        Delete this <b>{TYPE_META[tx.type]?.label ?? tx.type}</b> of <b>${Number(tx.amount).toLocaleString()}</b> ({STATUS_META[tx.status]?.label ?? tx.status}) for <b>{tx.user.firstName} {tx.user.lastName}</b>? This cannot be undone.
      </p>
      <AdjustBalanceToggle checked={adjust} onChange={setAdjust}
        hint="Reverses this record's effect on the user's balance and deposit/withdrawal totals." />
      {err && <p style={{ fontSize: 12, color: '#f87171', marginTop: 10 }}>{err}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 58%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={confirm} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={13} />} Delete
        </button>
      </div>
    </ModalShell>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminTransactions() {
  const navigate = useNavigate()
  const location = useLocation()
  // /admin/deposits and /admin/withdrawals open pre-filtered
  const routeType = location.pathname.endsWith('/deposits') ? 'DEPOSIT'
                  : location.pathname.endsWith('/withdrawals') ? 'WITHDRAWAL' : 'ALL'

  const [txns,       setTxns]       = useState<Transaction[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [actionId,   setActionId]   = useState<string | null>(null)
  const [actionMsg,  setActionMsg]  = useState<{ type: 'success'|'error'; text: string } | null>(null)
  const [proofModal, setProofModal] = useState<string | null>(null)

  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState(routeType)
  const [formTx,       setFormTx]       = useState<Transaction | null | undefined>(undefined) // undefined = closed, null = new
  const [deleteTx,     setDeleteTx]     = useState<Transaction | null>(null)

  useEffect(() => { setTypeFilter(routeType); setPage(1) }, [routeType])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page,         setPage]         = useState(1)
  const PER_PAGE = 15

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PER_PAGE),
        ...(typeFilter   !== 'ALL' ? { type:   typeFilter   } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      })
      const res = await adminApi.get<{ success: boolean; data: Transaction[]; meta: { total: number } }>(`/admin/transactions?${params}`)
      setTxns(res.data)
      setTotal(res.meta.total)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load transactions.')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = txns.filter(tx => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${tx.user.firstName} ${tx.user.lastName}`.toLowerCase().includes(q)
      || tx.user.email.toLowerCase().includes(q)
      || tx.id.toLowerCase().includes(q)
  })

  const totalPages       = Math.ceil(total / PER_PAGE)
  const totalDeposits    = txns.filter(t => t.type === 'DEPOSIT'    && t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0)
  const totalWithdrawals = txns.filter(t => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED').reduce((s, t) => s + Number(t.amount), 0)
  const pendingCount     = txns.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length

  async function approve(id: string) {
    setActionId(id)
    try {
      await adminApi.post(`/admin/transactions/${id}/approve`, {})
      setActionMsg({ type: 'success', text: 'Transaction approved and balance credited.' })
      load()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message ?? 'Approval failed.' })
    } finally { setActionId(null) }
  }

  async function reject(id: string) {
    setActionId(id)
    try {
      await adminApi.post(`/admin/transactions/${id}/reject`, { reason: 'Rejected by admin' })
      setActionMsg({ type: 'success', text: 'Transaction rejected.' })
      load()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message ?? 'Rejection failed.' })
    } finally { setActionId(null) }
  }

  return (
    <div style={{ padding: '20px 16px 40px' }} className="md:p-8">
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {proofModal && <ProofModal url={proofModal} onClose={() => setProofModal(null)} />}
      {formTx !== undefined && (
        <TxFormModal
          tx={formTx}
          defaultType={typeFilter === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'DEPOSIT'}
          onClose={() => setFormTx(undefined)}
          onSaved={msg => { setFormTx(undefined); setActionMsg({ type: 'success', text: msg }); load() }}
        />
      )}
      {deleteTx && (
        <DeleteTxModal
          tx={deleteTx}
          onClose={() => setDeleteTx(null)}
          onDeleted={msg => { setDeleteTx(null); setActionMsg({ type: 'success', text: msg }); load() }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'hsl(40 10% 96%)' }}>Transactions</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', marginTop: 3 }}>All platform transaction history · {total} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setFormTx(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={13} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div style={{ marginBottom: 16, padding: '11px 16px', borderRadius: 10, background: actionMsg.type === 'success' ? 'rgba(167,139,250,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${actionMsg.type === 'success' ? 'rgba(167,139,250,0.2)' : 'rgba(248,113,113,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: actionMsg.type === 'success' ? '#a78bfa' : '#f87171', fontSize: 13 }}>{actionMsg.text}</p>
          <button onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Transactions', value: String(total),                           c: '#a78bfa' },
          { label: 'Deposits (Done)',    value: `$${totalDeposits.toLocaleString()}`,    c: '#a78bfa' },
          { label: 'Withdrawals (Done)', value: `$${totalWithdrawals.toLocaleString()}`, c: '#f87171' },
          { label: 'Pending Actions',    value: String(pendingCount),                    c: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '15px 18px' }}>
            <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16, flexWrap: 'wrap' }}>
          <Clock size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', flex: 1 }}>{pendingCount} transaction(s) awaiting approval — review proof of payment and approve or reject.</p>
          <button onClick={() => { setStatusFilter('PENDING'); setPage(1) }} style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            Filter pending <ChevronRight size={11} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, email, ID…" style={{ width: '100%', height: 36, paddingLeft: 30, paddingRight: 10, borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(40 6% 88%)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <Filter size={13} style={{ color: 'hsl(240 5% 42%)', flexShrink: 0 }} />
          {['ALL','DEPOSIT','WITHDRAWAL','BONUS','PROFIT'].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }} style={filterBtn(typeFilter === t)}>
              {t === 'ALL' ? 'All Types' : TYPE_META[t]?.label || t}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          {['ALL','COMPLETED','PENDING','REJECTED','CANCELLED'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} style={filterBtn(statusFilter === s)}>
              {s === 'ALL' ? 'All Status' : STATUS_META[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '11px 16px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 14 }}>
          <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'hsl(240 5% 50%)', fontSize: 13 }}>Loading transactions…</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {['ID','USER','TYPE','AMOUNT','DESTINATION','DATE','STATUS','PROOF','ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'hsl(240 5% 42%)', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const tm   = TYPE_META[tx.type]     ?? { c: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: tx.type }
                  const st   = STATUS_META[tx.status]  ?? { c: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: tx.status, icon: Clock }
                  const isOut = tx.type === 'WITHDRAWAL'
                  const col  = avatarColor(tx.user.email)
                  const ini  = `${tx.user.firstName?.[0] ?? ''}${tx.user.lastName?.[0] ?? ''}`.toUpperCase()
                  const busy = actionId === tx.id
                  const hasProof = !!(tx.proofUrl)

                  return (
                    <tr key={tx.id}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '11px 14px', fontSize: 10, fontFamily: 'monospace', color: 'hsl(240 5% 45%)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.id.slice(0, 10)}…</td>

                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: `${col}20`, border: `1px solid ${col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: col, flexShrink: 0 }}>{ini}</div>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'hsl(40 6% 85%)', whiteSpace: 'nowrap' }}>{tx.user.firstName} {tx.user.lastName}</p>
                            <p style={{ fontSize: 10, color: 'hsl(240 5% 46%)' }}>{tx.user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: tm.bg, color: tm.c }}>{tm.label}</span>
                      </td>

                      <td style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 700, color: isOut ? '#f87171' : '#a78bfa', whiteSpace: 'nowrap' }}>
                        {isOut ? '−' : '+'} ${Number(tx.amount).toLocaleString()}
                      </td>

                      {/* Destination — wallet address for withdrawals */}
                      <td style={{ padding: '11px 14px' }}>
                        <DestinationCell tx={tx} />
                      </td>

                      <td style={{ padding: '11px 14px', fontSize: 11, color: 'hsl(240 5% 48%)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.c, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <st.icon size={10} />{st.label}
                        </span>
                      </td>

                      {/* Proof column */}
                      <td style={{ padding: '11px 14px' }}>
                        {hasProof ? (
                          <button
                            onClick={() => setProofModal(tx.proofUrl!)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            <ImageIcon size={11} /> View Proof
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'hsl(240 5% 38%)' }}>—</span>
                        )}
                      </td>

                      {/* Actions column */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {(tx.status === 'PENDING' || tx.status === 'PROCESSING') && (
                            <>
                              <button onClick={() => approve(tx.id)} disabled={busy}
                                style={{ padding: '4px 9px', borderRadius: 6, background: busy ? 'rgba(255,255,255,0.04)' : 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: busy ? 'hsl(240 5% 40%)' : '#a78bfa', fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                                {busy ? '…' : '✓ Approve'}
                              </button>
                              <button onClick={() => reject(tx.id)} disabled={busy}
                                style={{ padding: '4px 9px', borderRadius: 6, background: busy ? 'rgba(255,255,255,0.04)' : 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: busy ? 'hsl(240 5% 40%)' : '#f87171', fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                                {busy ? '…' : '✗ Reject'}
                              </button>
                            </>
                          )}
                          {(tx.type === 'DEPOSIT' || tx.type === 'WITHDRAWAL') && (
                            <>
                              <button onClick={() => setFormTx(tx)} title="Edit"
                                style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Pencil size={10} /> Edit
                              </button>
                              <button onClick={() => setDeleteTx(tx)} title="Delete"
                                style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Trash2 size={10} /> Delete
                              </button>
                            </>
                          )}
                          <button onClick={() => navigate(`/admin/users/${tx.user.id ?? tx.userId}`)}
                            style={{ padding: '4px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            User <ChevronRight size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'hsl(240 5% 44%)' }}>
                    {total === 0 ? 'No transactions yet.' : 'No transactions match your filters.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 48%)' }}>Page {page} of {totalPages} · {total} total</p>
            <div style={{ display: 'flex', gap: 5 }}>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 28, height: 28, borderRadius: 6, border: page === p ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)', background: page === p ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)', color: page === p ? '#c4b5fd' : 'hsl(240 5% 55%)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
