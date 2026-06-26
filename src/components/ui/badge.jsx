import * as React from 'react'
import { cn } from '@/lib/utils.js'
const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
    outline: 'text-foreground',
    success: 'border-transparent bg-green-100 text-green-800 shadow',
    warning: 'border-transparent bg-yellow-100 text-yellow-800 shadow',
    info: 'border-transparent bg-blue-100 text-blue-800 shadow'
  }
  return <div ref={ref} className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', variants[variant] || variants.default, className)} {...props} />
})
Badge.displayName = 'Badge'
export { Badge }
