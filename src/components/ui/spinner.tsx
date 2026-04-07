import { Icons } from '@/components/icons';
import type { SvgIconProps } from '@mui/material/SvgIcon';

import { cn } from '@/lib/utils';

function Spinner({ className, ...props }: SvgIconProps) {
  return (
    <Icons.spinner
      role='status'
      aria-label='Loading'
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
