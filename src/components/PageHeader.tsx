"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  below?: ReactNode;
}

export function PageHeader({ title, description, actions, below }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
          {below}
        </div>
        {actions ? <div className="top-bar-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
