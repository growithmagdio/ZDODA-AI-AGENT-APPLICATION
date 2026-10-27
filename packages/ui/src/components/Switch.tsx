import React from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '../lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  size = 'md',
}) => {
  const rootSizes = {
    sm: 'w-[36px] h-[20px]',
    md: 'w-[44px] h-[24px]',
  };

  const thumbSizes = {
    sm: 'w-[16px] h-[16px] data-[state=checked]:translate-x-[16px]',
    md: 'w-[20px] h-[20px] data-[state=checked]:translate-x-[20px]',
  };

  return (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--surface-inset)] border border-[var(--separator)]',
        rootSizes[size],
        className
      )}
    >
      <RadixSwitch.Thumb
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 translate-x-0',
          thumbSizes[size]
        )}
      />
    </RadixSwitch.Root>
  );
};
