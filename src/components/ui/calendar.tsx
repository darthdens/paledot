// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { DayPicker, type DayButtonProps, type DropdownProps } from 'react-day-picker';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useSiteBrand } from '@/lib/site-brand';

function CalendarDropdown({ options, value, onChange, disabled, 'aria-label': label }: DropdownProps) {
  const brand = useSiteBrand();
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const select = (next: number) => {
    onChange?.({ target: { value: String(next) } } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };
  // Non-modal choices keep sibling header buttons clickable. Radix Select's
  // modal pointer lock otherwise retargets that click outside the clock menu.
  return <Popover open={open} onOpenChange={setOpen} modal={false}>
    <PopoverTrigger asChild><Button variant="outline" role="combobox" aria-label={label} aria-expanded={open} aria-haspopup="listbox" disabled={disabled} className="cosmos-calendar-select w-full justify-between min-w-0 h-11 min-h-11 gap-1 px-2 font-mono text-[11px] sm:text-[11px] bg-card"><span className="min-w-0 truncate">{options?.find(option => String(option.value) === String(value))?.label}</span><ChevronDown className="size-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
    <PopoverContent align="start" sideOffset={8} collisionPadding={8} onEscapeKeyDown={event => event.stopPropagation()} onCloseAutoFocus={event => event.preventDefault()} onOpenAutoFocus={event => {
      event.preventDefault();
      const selected = listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      selected?.focus();
      selected?.scrollIntoView({ block: 'nearest' });
    }} className={cn(brand === 'paledot' && 'paledot', 'cosmos-clock-picker cosmos-calendar-options z-[10020] w-auto min-w-[8rem] max-h-[min(264px,var(--radix-popover-content-available-height))] overflow-y-auto p-1 bg-card text-foreground border-border')}>
      <div ref={listRef} role="listbox" aria-label={label} onKeyDown={event => {
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []);
        const index = buttons.findIndex(button => button === document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
        buttons[next]?.focus();
      }}>
        {options?.map(option => <Button variant="ghost" role="option" aria-selected={String(option.value) === String(value)} tabIndex={String(option.value) === String(value) ? 0 : -1} key={option.value} disabled={option.disabled} onClick={() => select(option.value)} className="w-full justify-start gap-2 min-h-11 cursor-pointer font-mono text-xs rounded-md"><span className="size-4 shrink-0">{String(option.value) === String(value) && <Check className="size-4" />}</span>{option.label}</Button>)}
      </div>
    </PopoverContent>
  </Popover>;
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