import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-black transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-indigo-600 text-white shadow-xs',
        secondary: 'border-transparent bg-slate-100 text-slate-800',
        destructive: 'border-transparent bg-rose-500 text-white shadow-xs',
        outline: 'text-slate-800 border-slate-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
        blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
        purple: 'bg-purple-50 text-purple-700 border-purple-200/80'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
