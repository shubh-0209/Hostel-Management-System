import React from 'react';
import { cn } from '../../lib/utils';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  return (
    <div className={cn(
      "pointer-events-auto flex w-full max-w-md items-center gap-4 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-right-full duration-300",
      type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-900",
      type === 'error' && "bg-red-50 border-red-200 text-red-900",
      type === 'info' && "bg-blue-50 border-blue-200 text-blue-900"
    )}>
      <div className="shrink-0">
        {type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        {type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
        {type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
      </div>
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button
        onClick={onClose}
        className={cn(
          "shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100",
          type === 'success' && "hover:bg-emerald-100",
          type === 'error' && "hover:bg-red-100",
          type === 'info' && "hover:bg-blue-100"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
