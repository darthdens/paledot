// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef, type ChangeEvent } from 'react';
import { DayPicker, type DayButtonProps, type DropdownProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSiteBrand } from '@/lib/site-brand';

function CalendarDropdown({ options, value, onChange, disabled, 'aria-label': label }: DropdownProps) {
  const brand = useSiteBrand();
  return <Select value={String(value)} disabled={disabled} onValueChange={next => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}>
    <SelectTrigger aria-label={label} className="cosmos-calendar-select min-w-0 h-11 min-h-11 gap-1 px-2 font-mono text-[11px] sm:text-[11px] bg-card"><SelectValue /></SelectTrigger>
    <SelectContent sideOffset={8} collisionPadding={8} onEscapeKeyDown={event => event.stopPropagation()} className={cn(brand === 'paledot' && 'paledot', 'cosmos-clock-picker cosmos-calendar-options z-[10020] max-h-[min(264px,var(--radix-select-content-available-height))] bg-card text-foreground border-border')}>
      {options?.map(option => <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled} className="min-h-11 cursor-pointer font-mono text-xs rounded-md">{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}

function CalendarDayButton({ day, modifiers, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (modifiers['focused']) ref.current?.focus(); }, [modifiers['focused']]);
  return <Button ref={ref} variant="ghost" {...props} data-selected={modifiers['selected'] || undefined} />;
}

export function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return <DayPicker className={cn('cosmos-calendar', className)} showOutsideDays
    classNames={{ root: 'relative', months: 'flex flex-col', month: 'space-y-2', month_caption: 'flex items-center min-h-11 mx-[52px]', caption_label: 'font-mono text-xs', nav: 'absolute inset-x-0 top-0 flex justify-between pointer-events-none', button_previous: 'h-11 w-11 pointer-events-auto', button_next: 'h-11 w-11 pointer-events-auto', dropdowns: 'grid grid-cols-[minmax(0,1fr)_76px] min-w-0 gap-2 w-full', dropdown_root: 'relative min-w-0', dropdown: 'w-full min-h-11 bg-card border border-border rounded-md px-2 text-xs text-foreground', month_grid: 'w-full border-collapse', weekdays: 'flex', weekday: 'flex-1 text-center text-xs text-muted-foreground py-2', week: 'flex', day: 'flex-1 min-w-0 text-center', day_button: 'w-full h-11 min-h-11 rounded-md p-0 font-mono text-xs', outside: 'text-muted-foreground', disabled: 'opacity-40', today: 'underline underline-offset-4', ...classNames }}
    components={{ Dropdown: CalendarDropdown, DayButton: CalendarDayButton, PreviousMonthButton: ({ ...buttonProps }) => <Button variant="outline" size="icon" {...buttonProps} />, NextMonthButton: ({ ...buttonProps }) => <Button variant="outline" size="icon" {...buttonProps} />, Chevron: ({ orientation }) => orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" /> }}
    {...props} />;
}