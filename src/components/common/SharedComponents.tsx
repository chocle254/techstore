import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Skeleton className="aspect-square w-full bg-muted" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-3/4 bg-muted" />
        <Skeleton className="h-3 w-20 bg-muted" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 bg-muted" />
          <Skeleton className="h-8 w-16 bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({ title, link, linkText = 'View All' }: { title: string; link?: string; linkText?: string }) {
  return (
    <div className="section-header">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {link && (
        <a href={link} className="text-sm text-primary hover:underline font-medium">
          {linkText}
        </a>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
