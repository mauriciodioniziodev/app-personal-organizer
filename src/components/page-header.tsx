import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export default function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <h1 className="text-4xl font-headline text-foreground">{title}</h1>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
