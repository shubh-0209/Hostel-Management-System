import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function Tabs({ tabs, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0].value);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-start rounded-lg bg-slate-100 p-1 text-slate-500 max-w-fit mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              activeTab === tab.value ? "bg-white text-slate-950 shadow-sm" : "hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-2 ring-offset-background focus-visible:outline-none">
        {tabs.find(t => t.value === activeTab)?.content}
      </div>
    </div>
  );
}