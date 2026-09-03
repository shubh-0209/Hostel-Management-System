import React from 'react';
import { cn } from '../../lib/utils';

export function Avatar({ src, fallback, className }) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100", className)}>
      {src ? (
        <img className="aspect-square h-full w-full object-cover" src={src} alt="Avatar" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {fallback}
        </div>
      )}
    </div>
  );
}