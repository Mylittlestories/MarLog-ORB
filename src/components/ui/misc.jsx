// components/ui/misc.jsx — small shared building blocks.
import { forwardRef } from 'react'
import { cn } from '@/lib/utils.js'
import { Label } from './label.jsx'
import { Input } from './input.jsx'
import { Button } from './button.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './dialog.jsx'

/** Consistent page heading with an optional right-side action slot. */
export function PageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        {Icon && <div className="mt-1 p-2 rounded-lg bg-blue-50 text-blue-700"><Icon className="w-5 h-5" /></div>}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/** Compact metric card. */
export function StatCard({ label, value, hint, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-300', blue: 'text-blue-400', green: 'text-green-500',
    amber: 'text-amber-500', red: 'text-red-400',
  }
  return (
    <div className="rounded-xl border bg-white p-4 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className={cn('w-4 h-4', tones[tone] || tones.slate)} />}
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  )
}

/** Friendly empty state. */
export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="text-center py-10 text-slate-400">
      {Icon && <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />}
      <p className="text-base font-semibold text-slate-500">{title}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** Label + field wrapper to keep forms tidy. */
export function Field({ label, htmlFor, required, error, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function TextField({ label, htmlFor, error, required, className, ...props }) {
  return (
    <Field label={label} htmlFor={htmlFor} error={error} required={required} className={className}>
      <Input id={htmlFor} {...props} className={cn(error && 'border-red-500')} />
    </Field>
  )
}

/** Confirm dialog for destructive actions. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', tone = 'destructive', onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
