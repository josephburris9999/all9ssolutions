import { cn } from '@/lib/utils';

type ConsultationEmailDeliveryBadgeProps = {
  status: 'delivered' | 'bounced' | null;
  className?: string;
};

export function ConsultationEmailDeliveryBadge({
  status,
  className,
}: ConsultationEmailDeliveryBadgeProps) {
  if (status !== 'bounced') {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive',
        className
      )}
    >
      Email bounced
    </span>
  );
}
