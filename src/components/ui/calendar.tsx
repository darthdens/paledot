// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef } from 'react';
import { DayPicker, type DayButtonProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function CalendarDayButton({ day, modifiers, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (modifiers['focused']) ref.current?.focus(); }, [modifiers['focused']]);
  return <Button ref={ref} variant="ghost" {...props} data-selected={modifiers['selected'] || undefined} />;
}

export function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return <DayPicker className={cn('cosmos-calendar', className)} showOutsideDays
    classNames={{ root: 'relative', months: 'flex flex-col', month: 'space-y-2', month_caption: 'flex items-center min-h-11', caption_label: 'font-mono text-xs', nav: 'flex justify-between gap-2', button_previous: 'h-11 w-11', button_next: 'h-11 w-11', dropdowns: 'flex min-w-0 gap-2 w-full', dropdown_root: 'relative min-w-0 flex-1', dropdown: 'w-full min-h-11 bg-card border border-border rounded-md px-2 text-xs text-foreground', month_grid: 'w-full border-collapse', weekdays: 'flex', weekday: 'flex-1 text-center text-xs text-muted-foreground py-2', week: 'flex', day: 'flex-1 min-w-0 text-center', day_button: 'w-full h-11 min-h-11 rounded-md p-0 font-mono text-xs', outside: 'text-muted-foreground', disabled: 'opacity-40', today: 'underline underline-offset-4', ...classNames }}
    components={{ DayButton: CalendarDayButton, PreviousMonthButton: ({ ...buttonProps }) => <Button variant="outline" size="icon" {...buttonProps} />, NextMonthButton: ({ ...buttonProps }) => <Button variant="outline" size="icon" {...buttonProps} />, Chevron: ({ orientation }) => orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" /> }}
    {...props} />;
}