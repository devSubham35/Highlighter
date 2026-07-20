import { cn } from '@/lib/utils';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonLoader } from './button-loader';


const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center cursor-pointer justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'inline-flex items-center justify-center gap-2 font-semibold text-sm leading-[20px] transition-all duration-200 ease-[var(--transition-fn)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] cursor-pointer select-none whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none overflow-hidden h-[var(--large-input-height)] px-[1.125rem] py-3 rounded-[var(--button-border-radius-lg)] [background:var(--button-brand-bg)] text-[var(--button-brand-color)] shadow-[var(--shadow-button)] hover:-translate-y-px hover:shadow-[var(--shadow-button-hover)] active:translate-y-0',
        outline:
          '!border-border/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-muted/60 dark:hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 text-foreground hover:border-primary/20',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[var(--white-opacity-8)] hover:text-content-primary aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-[#DA4E4E] text-white hover:bg-[#c44343] focus-visible:border-destructive focus-visible:ring-destructive/30 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),inset_0_1px_3px_0_rgba(255,255,255,0.32),inset_0_0_0_1px_rgba(255,255,255,0.12)] dark:bg-destructive dark:hover:bg-destructive/90',
        success: 'bg-success text-success-foreground hover:bg-success/80',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/80',
        info: 'bg-info text-info-foreground hover:bg-info/80',
        'outline-primary': 'border-primary text-primary hover:bg-primary/10',
        'outline-success': 'border-success text-success hover:bg-success/10',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'gap-1.5 rounded-[8px] py-3 px-6 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[6px] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[6px] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 rounded-[8px] px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8 rounded-[6px] border !border-border',
        'icon-xs':
          "size-6 rounded-[6px] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[6px] in-data-[slot=button-group]:rounded-md',
        'icon-lg': 'size-9 rounded-[8px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <ButtonLoader />
          {children}
        </span>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
