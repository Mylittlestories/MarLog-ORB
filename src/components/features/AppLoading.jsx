// components/features/AppLoading.jsx
import { Ship } from 'lucide-react'

export function AppLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center animate-pulse">
        <Ship className="w-7 h-7 text-white" />
      </div>
      <p className="mt-4 text-slate-500 text-sm">Loading MarLog ORB…</p>
    </div>
  )
}
