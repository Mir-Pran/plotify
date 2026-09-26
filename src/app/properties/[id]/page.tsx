import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MOCK_PROPERTIES } from '@/lib/data/mock-properties';
import PropertyDetailClient from './property-detail-client';

export async function generateStaticParams() {
  return MOCK_PROPERTIES.map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = MOCK_PROPERTIES.find(p => p.id === id);
  if (!property) return { title: 'Property Not Found' };
  return {
    title: property.title,
    description: property.description?.slice(0, 160) || `Explore ${property.title} in ${property.district}, Bangladesh on Plotify.`,
  };
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
