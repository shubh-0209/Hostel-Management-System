import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

export function StatCard({ title, value, icon, trend, trendUp, trendPositive }) {
  const isPositive = trendPositive !== undefined ? trendPositive : trendUp;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {icon}
        </div>
        <div className="flex items-baseline space-x-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h2>
          {trend && (
            <span className={cn("text-xs font-medium", isPositive ? "text-emerald-600" : "text-destructive")}>
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}