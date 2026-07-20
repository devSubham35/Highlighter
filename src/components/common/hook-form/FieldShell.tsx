'use client';

import { cn } from '@/lib/utils';
import { InfoTooltip } from '@/components/common/InfoTooltip';
import { Label } from '@/components/ui/label';

export interface FieldShellProps {
  label?: string;
  required?: boolean;
  tooltip?: string;
  error?: string;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}

/**
 * Shared label + tooltip + error-message chrome used by every RHF* field.
 * Keeps spacing and typography consistent across the form.
 */
function FieldShell({
  label,
  required,
  tooltip,
  error,
  helperText,
  fullWidth,
  className,
  labelClassName,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', fullWidth && 'col-span-full', className)}>
      {label && (
        <div className="flex items-center gap-1.5">
          <Label className={cn("text-sm font-medium text-foreground/80", labelClassName)}>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </Label>
          {tooltip && <InfoTooltip title={tooltip} />}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

export { FieldShell };
