import type { ComponentType } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

interface ComingSoonPageProps {
  title: string;
  icon: ComponentType<{ size?: number | string }>;
  phase: string;
  description: string;
}

export function ComingSoonPage({ title, icon: Icon, phase, description }: ComingSoonPageProps) {
  return (
    <div className="animate-fadeUp">
      <h1 className="text-2xl font-display font-semibold mb-6">{title}</h1>
      <EmptyState icon={<Icon size={32} />} title={`${title} arrives in ${phase}`} hint={description} />
    </div>
  );
}
