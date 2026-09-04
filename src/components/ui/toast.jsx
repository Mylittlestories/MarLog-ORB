// components/ui/toast.jsx — simple toast.
import { CheckCircle2, X } from 'lucide-react'

export function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-green-200 bg-white shadow-lg px-4 py-3">
      <CheckCircle2 className="w-5 h-5 text-green-600" />
      <span className="text-sm text-slate-700">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
    </div>
  )
}
export function ToastViewport({ children }) {
  return <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pointer-events-none">{children}</div>
}
