import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
};

export const EmptyState = ({ 
  title, 
  description, 
  icon: Icon, 
  action 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  action?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#1E1E1E] rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
      <div className="p-4 bg-accent/10 rounded-full text-accent mb-4">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">{description}</p>
      {action}
    </div>
  );
};
