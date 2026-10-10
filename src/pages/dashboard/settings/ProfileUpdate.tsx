import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Mail, Phone, MapPin, Flag, Calendar, User, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth, type AuthUser } from '@/context/AuthContext'

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, paddingLeft: 38, paddingRight: 14,
  borderRadius: 10, fontSize: 13, fontWeight: 500,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'hsl(40 6% 90%)', outline: 'none', boxSizing: 'border-box',
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: sub ? 2 : 16 }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 16 }}>{sub}</p>}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
      {children}
    </div>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 42%)', pointerEvents: 'none' }} />
        {children}
      </div>
    </div>
  )
}

const COUNTRIES = ['Nigeria', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Singapore', 'South Africa', 'UAE']
const OCCUPATIONS = ['Investor', 'Trader', 'Engineer', 'Business Owner', 'Finance Professional', 'Student', 'Other']

// Every field starts blank — values come only from the logged-in user's record.
function buildForm(user: AuthUser | null) {
  return {
    firstName:   user?.firstName   ?? '',
    lastName:    user?.lastName    ?? '',
    email:       user?.email       ?? '',
    phone:       user?.phone       ?? '',
    dob:         user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
    nationality: user?.nationality ?? '',
    occupation:  user?.occupation  ?? '',
    address:     user?.address     ?? '',
    city:        user?.city        ?? '',
    state:       user?.state       ?? '',
    postalCode:  user?.postalCode  ?? '',
    country:     user?.country     ?? '',
  }
}

// Keep a saved value selectable even if it isn't in the preset list.
const withValue = (list: string[], v: string) => (v && !list.includes(v) ? [v, ...list] : list)

export function ProfileUpdate() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(() => buildForm(user))

  // Fill the form once the user's data has loaded (or after a save refresh).
  useEffect(() => { setForm(buildForm(user)) }, [user])

  async function handleSave() {
    setError(null)
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.')
      return
    }
    setSaving(true)
    try {
      await api.patch('/user/me', {
        firstName:   form.firstName,
        lastName:    form.lastName,
        phone:       form.phone,
        dateOfBirth: form.dob,
        nationality: form.nationality,
        occupation:  form.occupation,
        address:     form.address,
        city:        form.city,
        state:       form.state,
        postalCode:  form.postalCode,
        country:     form.country,
      })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.message ?? 'Could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const }

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)', lineHeight: 1.2 }}>Profile Update</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Edit your personal and contact information</p>
        </div>
      </div>

      {/* Personal Info */}
      <Card title="Personal Information" sub="Your legal name and personal details">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First Name" icon={User}>
            <input style={inputStyle} value={form.firstName} onChange={set('firstName')} placeholder="John" />
          </Field>
          <Field label="Last Name" icon={User}>
            <input style={inputStyle} value={form.lastName} onChange={set('lastName')} placeholder="Doe" />
          </Field>
          <Field label="Date of Birth" icon={Calendar}>
            <input type="date" style={inputStyle} value={form.dob} onChange={set('dob')} />
          </Field>
          <Field label="Nationality" icon={Flag}>
            <select style={selectStyle} value={form.nationality} onChange={set('nationality')}>
              <option value="" style={{ background: 'hsl(260 87% 6%)' }}>Select nationality</option>
              {withValue(COUNTRIES, form.nationality).map(c => <option key={c} value={c} style={{ background: 'hsl(260 87% 6%)' }}>{c}</option>)}
            </select>
          </Field>
          <Field label="Occupation" icon={User}>
            <select style={selectStyle} value={form.occupation} onChange={set('occupation')}>
              <option value="" style={{ background: 'hsl(260 87% 6%)' }}>Select occupation</option>
              {withValue(OCCUPATIONS, form.occupation).map(o => <option key={o} value={o} style={{ background: 'hsl(260 87% 6%)' }}>{o}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {/* Contact Info */}
      <Card title="Contact Information" sub="How we'll reach you">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email Address" icon={Mail}>
            <input style={{ ...inputStyle, color: 'hsl(240 5% 50%)' }} value={form.email} placeholder="johndoe@gmail.com" readOnly />
          </Field>
          <Field label="Phone Number" icon={Phone}>
            <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
          </Field>
        </div>
        <p style={{ fontSize: 11, color: 'hsl(240 5% 42%)', marginTop: -8 }}>Email cannot be changed directly. Contact support to update it.</p>
      </Card>

      {/* Address */}
      <Card title="Residential Address" sub="Required for KYC verification">
        <Field label="Street Address" icon={MapPin}>
          <input style={inputStyle} value={form.address} onChange={set('address')} placeholder="123 Main Street" />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="City" icon={MapPin}>
            <input style={inputStyle} value={form.city} onChange={set('city')} placeholder="City" />
          </Field>
          <Field label="State / Province" icon={MapPin}>
            <input style={inputStyle} value={form.state} onChange={set('state')} placeholder="State" />
          </Field>
          <Field label="Postal Code" icon={MapPin}>
            <input style={inputStyle} value={form.postalCode} onChange={set('postalCode')} placeholder="00000" />
          </Field>
        </div>
        <Field label="Country" icon={Flag}>
          <select style={selectStyle} value={form.country} onChange={set('country')}>
            <option value="" style={{ background: 'hsl(260 87% 6%)' }}></option>
            {withValue(COUNTRIES, form.country).map(c => <option key={c} value={c} style={{ background: 'hsl(260 87% 6%)' }}>{c}</option>)}
          </select>
        </Field>
      </Card>

      {error && (
        <p style={{ fontSize: 12, color: '#f87171', textAlign: 'right', marginBottom: 10 }}>{error}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, background: saved ? 'rgba(167,139,250,0.15)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: saved ? '1px solid rgba(167,139,250,0.3)' : 'none', color: saved ? '#a78bfa' : '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
