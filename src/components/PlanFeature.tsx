import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

/** Banner / kunci fitur berdasarkan paket */
export function PlanLockBanner({
  feature,
  planName,
}: {
  feature: string
  planName: string
}) {
  return (
    <div className="plan-lock">
      <p>
        <strong>{feature}</strong> tidak termasuk paket <em>{planName}</em>.
      </p>
      <Link to="/harga" className="plan-lock__cta">
        Lihat harga & upgrade
      </Link>
    </div>
  )
}

export function PlanFeature({
  allowed,
  feature,
  planName,
  children,
}: {
  allowed: boolean
  feature: string
  planName: string
  children: ReactNode
}) {
  if (allowed) return children
  return <PlanLockBanner feature={feature} planName={planName} />
}
