import { useState, useRef } from 'react'
import { ArrowLeft, Upload, CheckCircle2, Clock, AlertCircle, ChevronRight, FileText, Camera, User, Shield, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'

const STEPS = ['Personal Details', 'ID Document', 'Selfie Verification', 'Review']

// Backend expects one of these docType values (see kyc.controller.ts / KYCPage.tsx)
type DocType = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE'

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: done ? 'rgba(167,139,250,0.15)' : active ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)',
      border: done ? '2px solid rgba(167,139,250,0.4)' : active ? '2px solid rgba(167,139,250,0.5)' : '2px solid rgba(255,255,255,0.08)',
      fontSize: 12, fontWeight: 800,
      color: done ? '#a78bfa' : active ? '#c4b5fd' : 'hsl(240 5% 45%)',
    }}>
      {done ? <CheckCircle2 size={14} /> : n}
    </div>
  )
}

// Controlled upload zone — holds a real File and reports it to the parent.
function UploadZone({ label, hint, file, onFile }: { label: string; hint: string; file: File | null; onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploaded = !!file
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f) }}
      style={{
        border: `2px dashed ${uploaded ? 'rgba(167,139,250,0.4)' : dragging ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 14, padding: '28px 20px', textAlign: 'center',
        background: uploaded ? 'rgba(167,139,250,0.04)' : dragging ? 'rgba(167,139,250,0.05)' : 'rgba(255,255,255,0.02)',
        cursor: 'pointer', transition: 'all 0.2s', marginBottom: 16,
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      {uploaded ? (
        <>
          <CheckCircle2 size={28} style={{ color: '#a78bfa', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Document uploaded</p>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 3, wordBreak: 'break-all' }}>{file!.name} · Click to replace</p>
        </>
      ) : (
        <>
          <Upload size={28} style={{ color: 'hsl(240 5% 42%)', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 85%)' }}>{label}</p>
          <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)', marginTop: 4 }}>{hint}</p>
          <button type="button" style={{ marginTop: 12, fontSize: 12, fontWeight: 600, padding: '7px 18px', borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd', cursor: 'pointer' }}>
            Browse files
          </button>
        </>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 14px',
  borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)', color: 'hsl(40 6% 90%)',
  outline: 'none', boxSizing: 'border-box',
}

export function KYCVerification() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [step, setStep] = useState(0)
  const [docType, setDocType] = useState<DocType>('PASSPORT')

  // Form state
  const [firstName,   setFirstName]   = useState(user?.firstName ?? '')
  const [lastName,    setLastName]    = useState(user?.lastName  ?? '')
  const [dob,         setDob]         = useState('')
  const [nationality, setNationality] = useState('')
  const [frontFile,   setFrontFile]   = useState<File | null>(null)
  const [backFile,    setBackFile]    = useState<File | null>(null)
  const [selfieFile,  setSelfieFile]  = useState<File | null>(null)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [submitted,  setSubmitted]  = useState(false)

  const alreadyPending  = user?.kycStatus === 'PENDING'
  const alreadyApproved = user?.kycStatus === 'APPROVED'

  const DOC_TYPES: { id: DocType; label: string; icon: string }[] = [
    { id: 'PASSPORT',        label: 'Passport', icon: '🛂' },
    { id: 'NATIONAL_ID',     label: 'National ID', icon: '🪪' },
    { id: 'DRIVERS_LICENSE', label: "Driver's License", icon: '🚗' },
  ]

  const LEVEL_STATUS = [
    { level: 'Level 1 — Email Verified',    status: 'Verified',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  icon: CheckCircle2 },
    { level: 'Level 2 — Identity (KYC)',     status: alreadyApproved ? 'Verified' : alreadyPending ? 'Pending' : 'Required', color: alreadyApproved ? '#a78bfa' : '#f59e0b', bg: alreadyApproved ? 'rgba(167,139,250,0.1)' : 'rgba(245,158,11,0.1)', icon: alreadyApproved ? CheckCircle2 : Clock },
    { level: 'Level 3 — Enhanced Due Diligence', status: 'Locked', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: Shield },
  ]

  // Validate the current step before advancing.
  function canAdvance(): string | null {
    if (step === 0) {
      if (!firstName.trim()) return 'First name is required.'
      if (!lastName.trim())  return 'Last name is required.'
    }
    if (step === 1) {
      if (!frontFile) return 'Front of your document is required.'
      if (!backFile)  return 'Back of your document is required.'
    }
    return null
  }

  function handleNext() {
    const msg = canAdvance()
    if (msg) { setError(msg); return }
    setError('')
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  async function handleSubmit() {
    setError('')
    if (!firstName.trim() || !lastName.trim()) { setError('Please complete your personal details.'); setStep(0); return }
    if (!frontFile || !backFile)               { setError('Please upload both sides of your document.'); setStep(1); return }

    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('docType',   docType)
      form.append('docNumber', 'N/A') // legacy NOT NULL column — user no longer supplies this
      form.append('firstName', firstName)
      form.append('lastName',  lastName)
      if (nationality.trim()) form.append('address', nationality) // reuse address field for nationality note
      form.append('front', frontFile)
      form.append('back',  backFile)
      if (selfieFile) form.append('selfie', selfieFile)

      await api.upload('/kyc/submit', form)
      await refreshUser()
      setSubmitted(true)
    } catch (e: any) {
      setError(e?.message ?? 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success / already-submitted screen ──────────────────────────────────────
  if (submitted || alreadyPending || alreadyApproved) {
    const approved = alreadyApproved
    return (
      <div className="p-4 md:p-6 max-w-[760px] mx-auto">
        <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: approved ? 'rgba(167,139,250,0.15)' : 'rgba(245,158,11,0.12)', border: `1px solid ${approved ? 'rgba(167,139,250,0.3)' : 'rgba(245,158,11,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            {approved ? <CheckCircle2 size={30} style={{ color: '#a78bfa' }} /> : <Clock size={28} style={{ color: '#fbbf24' }} />}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(40 10% 96%)', marginBottom: 8 }}>
            {approved ? 'Identity Verified' : 'Verification Pending'}
          </h2>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 55%)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
            {approved
              ? 'Your identity has been verified. You have full access to the platform.'
              : 'Your documents have been submitted and are under review. This usually takes 24–48 hours, and you\'ll be notified by email once complete.'}
          </p>
          <button onClick={() => navigate('/dashboard')} style={{ marginTop: 22, padding: '10px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(40 6% 85%)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[760px] mx-auto overflow-x-hidden">
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'hsl(240 5% 60%)', fontSize: 12 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(40 10% 96%)' }}>KYC Verification</h1>
          <p style={{ fontSize: 13, color: 'hsl(240 5% 52%)' }}>Verify your identity to unlock full account features</p>
        </div>
      </div>

      {/* Verification Levels */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 14 }}>Verification Levels</p>
        {LEVEL_STATUS.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < LEVEL_STATUS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <l.icon size={15} style={{ color: l.color }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(40 6% 85%)' }}>{l.level}</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, color: l.color, background: l.bg }}>{l.status}</span>
          </div>
        ))}
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => i <= step && setStep(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: i <= step ? 'pointer' : 'default' }}>
              <StepBadge n={i + 1} active={i === step} done={i < step} />
              <span style={{ fontSize: 10, fontWeight: 600, color: i === step ? '#c4b5fd' : i < step ? '#a78bfa' : 'hsl(240 5% 45%)', whiteSpace: 'nowrap' }}>{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div style={{ width: 36, height: 2, background: i < step ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)', margin: '0 6px', marginBottom: 18, flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 12.5 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Step Content */}
      <div style={{ background: 'hsl(260 60% 5%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 20 }}>

        {/* Step 0 — Personal Details */}
        {step === 0 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Personal Details</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Enter your details exactly as they appear on your government-issued ID.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Legal First Name</label>
                <input style={inputStyle} placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Legal Last Name</label>
                <input style={inputStyle} placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Date of Birth</label>
                <input style={inputStyle} type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(240 5% 50%)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nationality</label>
                <input style={inputStyle} placeholder="USA" value={nationality} onChange={e => setNationality(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Step 1 — ID Document */}
        {step === 1 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Upload Identity Document</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Select document type and upload a clear, unobstructed photo.</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {DOC_TYPES.map(d => (
                <button key={d.id} onClick={() => setDocType(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', border: docType === d.id ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.08)', background: docType === d.id ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', color: docType === d.id ? '#c4b5fd' : 'hsl(240 5% 60%)', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
                  <span>{d.icon}</span> {d.label}
                </button>
              ))}
            </div>
            <UploadZone label="Upload Front of Document" hint="JPG, PNG or PDF · Max 10MB" file={frontFile} onFile={f => { setFrontFile(f); setError('') }} />
            <UploadZone label="Upload Back of Document" hint="JPG, PNG or PDF · Max 10MB" file={backFile} onFile={f => { setBackFile(f); setError('') }} />
          </>
        )}

        {/* Step 2 — Selfie */}
        {step === 2 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Selfie Verification</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Take a clear photo of your face to verify it matches your document. (Optional)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {['✅ Good lighting','✅ Face fully visible','❌ No sunglasses','❌ No hat or cap'].map(tip => (
                <div key={tip} style={{ padding: '10px 14px', borderRadius: 10, background: tip.startsWith('✅') ? 'rgba(167,139,250,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${tip.startsWith('✅') ? 'rgba(167,139,250,0.15)' : 'rgba(248,113,113,0.15)'}`, fontSize: 12, color: tip.startsWith('✅') ? '#a78bfa' : '#f87171' }}>
                  {tip}
                </div>
              ))}
            </div>
            <UploadZone label="Upload Selfie Photo" hint="Hold your ID next to your face · JPG or PNG" file={selfieFile} onFile={f => { setSelfieFile(f); setError('') }} />
          </>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40 10% 94%)', marginBottom: 4 }}>Review & Submit</p>
            <p style={{ fontSize: 12, color: 'hsl(240 5% 52%)', marginBottom: 20 }}>Please review your submitted information before sending.</p>
            {[
              { label: 'Full Name',     value: `${firstName} ${lastName}`.trim() || '—', icon: User },
              { label: 'Document Type', value: DOC_TYPES.find(d => d.id === docType)?.label ?? docType, icon: FileText },
              { label: 'Documents',     value: `${frontFile ? 'Front ✓' : 'Front ✗'} · ${backFile ? 'Back ✓' : 'Back ✗'}`, icon: FileText },
              { label: 'Selfie',        value: selfieFile ? '1 photo uploaded' : 'Not provided', icon: Camera },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <row.icon size={14} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'hsl(240 5% 50%)' }}>{row.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(40 6% 88%)' }}>{row.value}</p>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.6 }}>By submitting, you confirm all provided information is accurate. False information may result in account suspension.</p>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} disabled={submitting} style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'hsl(240 5% 55%)', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1 }}>
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        <button
          onClick={() => step < STEPS.length - 1 ? handleNext() : handleSubmit()}
          disabled={submitting}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, background: step === STEPS.length - 1 ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
          {step === STEPS.length - 1
            ? (submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <>🚀 Submit Verification</>)
            : <>Continue <ChevronRight size={14} /></>}
        </button>
      </div>
    </div>
  )
}
