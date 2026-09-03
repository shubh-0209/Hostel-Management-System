import React from 'react';
import { Badge } from '../ui/Badge';

export function StatusBadge({ status }) {
  let variant = "default";
  const s = status?.toLowerCase() || '';

  if (['active', 'success', 'approved', 'available', 'allocated'].includes(s)) variant = "success";
  else if (['pending', 'warning', 'reserved'].includes(s)) variant = "warning";
  else if (['error', 'danger', 'rejected', 'maintenance'].includes(s)) variant = "destructive";

  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}