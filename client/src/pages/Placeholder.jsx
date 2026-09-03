import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Placeholder({ title }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This module will be implemented in a future stage.</p>
        </CardContent>
      </Card>
    </div>
  );
}
