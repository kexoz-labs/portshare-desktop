import { useEffect, useState } from 'react'
import { Check, ArrowUpRight, X, Zap, Sparkles, Shield, Loader } from 'lucide-react'
import { API_BASE_URL } from '../../lib/api'

type Plan = {
  id: string
  name: string
  priceCents: number
  bandwidthLimit: number
  features: string[]
  active: boolean
}

type Props = {
  currentPlan: string
  clientId: string
  onClose: () => void
  onCheckout: (planId: string) => Promise<void>
}

function formatBytes(v: number) {
  if (v < 1024 * 1024 * 1024) return `${(v / 1024 / 1024).toFixed(0)} MB`
  return `${(v / 1024 / 1024 / 1024).toFixed(0)} GB`
}

const PLAN_ICON: Record<string, typeof Zap> = {
  pro_plus: Sparkles,
  pro: Zap,
  free: Shield,
}

export default function UpgradeModal({ currentPlan, onClose, onCheckout }: Props) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/plans`)
      .then(r => r.json() as Promise<{ plans?: Plan[] }>)
      .then(d => setPlans((d.plans ?? []).filter(p => p.active && p.id !== 'free')))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCheckout = async (planId: string) => {
    setSelectedPlanId(planId)
    setBusy(true)
    try {
      await onCheckout(planId)
    } finally {
      setBusy(false)
      setSelectedPlanId(null)
    }
  }

  return (
    <div className="ps-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ps-modal upgrade-modal">
        <div className="ps-modal-header">
          <div>
            <div className="ps-section-title">Upgrade your plan</div>
            <div className="ps-tunnel-card-subtitle">Choose a plan that grows with you</div>
          </div>
          <button className="ps-btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="upgrade-modal-body">
          {loading ? (
            <div className="upgrade-modal-loading">
              <Loader size={20} className="spin" />
              <span>Loading plans…</span>
            </div>
          ) : plans.length === 0 ? (
            <p style={{ color: 'var(--text-soft)', textAlign: 'center', padding: '24px 0' }}>
              Plans unavailable. Visit <a href="https://portshare.kexoz.dev/pricing" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>portshare.kexoz.dev/pricing</a>
            </p>
          ) : (
            <div className="upgrade-plans-grid">
              {plans.map(plan => {
                const isCurrent = plan.id === currentPlan
                const Icon = PLAN_ICON[plan.id] ?? Zap
                return (
                  <div key={plan.id} className={`upgrade-plan-card${isCurrent ? ' current' : ''}${plan.id === 'pro' ? ' featured' : ''}`}>
                    {plan.id === 'pro' && !isCurrent && (
                      <div className="upgrade-plan-badge">Most Popular</div>
                    )}
                    {isCurrent && (
                      <div className="upgrade-plan-badge current-badge">Current Plan</div>
                    )}
                    <div className="upgrade-plan-icon">
                      <Icon size={18} />
                    </div>
                    <h3 className="upgrade-plan-name">{plan.name}</h3>
                    <div className="upgrade-plan-price">
                      {plan.priceCents === 0 ? 'Free' : `$${(plan.priceCents / 100).toFixed(0)}`}
                      {plan.priceCents > 0 && <span>/mo</span>}
                    </div>
                    <div className="upgrade-plan-bw">{formatBytes(plan.bandwidthLimit)} / month</div>
                    <ul className="upgrade-plan-features">
                      {plan.features.map(f => (
                        <li key={f}><Check size={11} />{f}</li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="upgrade-plan-current"><Check size={13} /> Active</div>
                    ) : (
                      <button
                        className={`ps-btn ps-btn-primary ps-btn-sm upgrade-plan-btn${plan.id === 'pro' ? ' upgrade-plan-btn-featured' : ''}`}
                        onClick={() => void handleCheckout(plan.id)}
                        disabled={busy}
                      >
                        {busy && selectedPlanId === plan.id
                          ? <Loader size={13} className="spin" />
                          : <ArrowUpRight size={13} />}
                        Upgrade to {plan.name}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          <p className="upgrade-footer-note">
            Subscription is month-to-month. Cancel anytime from your <a href={`https://portshare.kexoz.dev/account`} target="_blank" rel="noreferrer">account portal</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
