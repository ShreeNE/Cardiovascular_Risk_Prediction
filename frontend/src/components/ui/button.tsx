import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-amber-500/20 text-amber-200 border border-amber-500/50 hover:bg-amber-500/30 hover:border-amber-400',
        rpg:
          'bg-gradient-to-r from-amber-600/30 via-amber-500/30 to-amber-600/30 text-amber-100 border border-amber-400/60 hover:border-amber-300 hover:text-white shadow-[0_0_15px_rgba(251,191,36,0.15)] font-serif tracking-widest uppercase',
        secondary:
          'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-slate-100',
        outline:
          'border border-slate-800 bg-transparent hover:bg-slate-900 hover:text-slate-100',
        ghost:
          'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400',
        link: 'text-amber-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
