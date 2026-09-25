import React from 'react';
import { notFound } from 'next/navigation';
import { MOCK_PROPERTIES } from '@/lib/data/mock-properties';
import PropertyDetailClient from './property-detail-client';

export async function generateStaticParams() {
  return MOCK_PROPERTIES.map(p => ({ id: p.id }));
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find(p => p.id === id);
  if (!property) notFound();

  const related = MOCK_PROPERTIES.filter(p =>
    p.id !== property.id &&
    (p.area === property.area || p.category === property.category)
  ).slice(0, 3);

  return <PropertyDetailClient initialProperty={property} related={related} />;
}
