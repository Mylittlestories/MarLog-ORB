// components/features/CompliancePanel.jsx — live MARPOL compliance feedback.
import { useMemo, useEffect } from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, Info } from 'lucide-react'
import { validateEntry, SEVERITY, severityLabel } from '@/lib/compliance/regulations.js'
import { cn } from '@/lib/utils.js'

const ICON = { [SEVERITY.BLOCKED]: ShieldX, [SEVERITY.WARNING]: ShieldAlert, [SEVERITY.INFO]: Info, ok: ShieldCheck }
const BORDER = { [SEVERITY.BLOCKED]: 'border-red-200 bg-red-50', [SEVERITY.WARNING]: 'border-amber-200 bg-amber-50', [SEVERITY.INFO]: 'border-blue-200 bg-blue-50', ok: 'border-green-200 bg-green-50' }
const TEXT = { [SEVERITY.BLOCKED]: 'text-red-700', [SEVERITY.WARNING]: 'text-amber-700', [SEVERITY.INFO]: 'text-blue-700', ok: 'text-green-700' }

export function CompliancePanel({ formData, tanks = [], equipment = [], onBlockedChange }) {
  const result = useMemo(() => validateEntry(formData, { tanks, equipment }), [formData, tanks, equipment])
  const hasBlocked = result.worstSeverity === SEVERITY.BLOCKED

  useEffect(() => { onBlockedChange?.(hasBlocked) }, [hasBlocked, onBlockedChange])

  const tone = hasBlocked ? SEVERITY.BLOCKED : result.worstSeverity || 'ok'
  const Icon = ICON[tone]

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className={cn('flex items-center gap-3 px-4 py-3 border-b', BORDER[tone])}>
        <Icon className={cn('w-5 h-5', TEXT[tone])} />
        <div className="flex-1">
          <p className={cn('font-semibold text-sm', TEXT[tone])}>
            {result.findings.length === 0 ? 'No compliance issues detected' : `${result.findings.length} check${result.findings.length > 1 ? 's' : ''} — ${severityLabel(result.worstSeverity || 'ok')}`}
          </p>
          <p className="text-xs text-slate-500">MARPOL 73/78 rules · advisory — final responsibility rests with the vessel/operator.</p>
        </div>
      </div>
      {result.findings.length > 0 && (
        <ul className="divide-y divide-slate-100 bg-white">
          {result.findings.map((f) => {
            const Fi = ICON[f.severity]
            return (
              <li key={f.ruleId} className="flex items-start gap-3 px-4 py-2.5">
                {Fi && <Fi className={cn('w-4 h-4 mt-0.5', TEXT[f.severity])} />}
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{f.message}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{f.ruleId} · {f.reference}</p>
                </div>
                <span className={cn('text-[11px] font-semibold uppercase tracking-wide', TEXT[f.severity])}>{severityLabel(f.severity)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
