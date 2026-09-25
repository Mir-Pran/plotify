'use client';

import dynamic from 'next/dynamic';

const FloatingActions = dynamic(() => import('@/components/floating-actions'), { ssr: false });
const PlotiAI = dynamic(() => import('@/components/ploti-ai'), { ssr: false });

export default function FloatingWidgets() {
  return (
    <>
      <FloatingActions />
      <PlotiAI />
    </>
  );
}
