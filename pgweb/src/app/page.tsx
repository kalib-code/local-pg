import { Suspense } from 'react';
import DbInterface from '@/components/DbInterface';

export default function Home() {
  return (
    <Suspense fallback={<div className="p-4">Loading database interface...</div>}>
      <DbInterface />
    </Suspense>
  );
}