import React from 'react';
import { EmptyState, LargeTitleHeader } from '@zdoda/ui';

export interface FeaturePlaceholderPageProps {
  title: string;
  description: string;
  phase: number;
  icon: React.ReactNode;
}

export const FeaturePlaceholderPage: React.FC<FeaturePlaceholderPageProps> = ({
  title,
  description,
  phase,
  icon,
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      <LargeTitleHeader title={title} subtitle={`Scheduled for Phase ${phase} implementation.`} />
      <EmptyState
        icon={icon}
        title={`${title} Module`}
        description={description}
        comingInPhase={phase}
      />
    </div>
  );
};
