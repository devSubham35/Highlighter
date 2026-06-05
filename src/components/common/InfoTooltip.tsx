'use client';

import { InfoIcon } from '@phosphor-icons/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  title: string;
  children?: React.ReactNode;
}

function InfoTooltip({ title, children }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          {children ?? <InfoIcon size={18} weight="fill" />}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <span className="block whitespace-normal wrap-break-word">
            {title}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { InfoTooltip };
