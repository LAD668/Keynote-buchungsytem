import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  active?: boolean;
};

type TimelineProps = {
  items: TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-[88px,1fr] gap-4">
          <p className="pt-1 text-sm text-text-secondary">{item.time}</p>
          <div className="relative pb-3">
            {index !== items.length - 1 ? (
              <span className="absolute left-[7px] top-6 h-full w-px bg-border" aria-hidden />
            ) : null}
            <span
              className={cn(
                "absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-card",
                item.active ? "border-brand" : "border-border"
              )}
              aria-hidden
            />
            <Card className={cn("ml-7", item.active ? "border-brand" : undefined)} selected={item.active}>
              <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
              {item.description ? (
                <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
              ) : null}
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
