import React from 'react';
import { Button } from '../ui/Button';

export function OutingRequestCard({ request }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <div className="flex items-center space-x-2">
          <h4 className="font-semibold text-slate-900 text-sm">{request.studentName}</h4>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Room {request.roomNumber}</span>
        </div>
        <div className="mt-1 text-xs text-slate-500 flex items-center space-x-2">
          <span>Out: {request.outDate}</span>
          <span>•</span>
          <span>In: {request.inDate}</span>
        </div>
        <p className="text-xs text-slate-600 mt-2 line-clamp-1">{request.reason}</p>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" className="h-8 px-3 text-xs bg-white text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive/30">Decline</Button>
        <Button className="h-8 px-3 text-xs">Approve</Button>
      </div>
    </div>
  );
}
