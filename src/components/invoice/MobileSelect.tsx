import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileSelectOption {
  value: string;
  label: string;
  isSeparator?: boolean;
}

interface MobileSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  title?: string;
  className?: string;
  triggerClassName?: string;
}

export function MobileSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  title = "Select",
  className,
  triggerClassName,
}: MobileSelectProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={cn(className)}>
          {options.map((opt) =>
            opt.isSeparator ? (
              <div
                key={opt.value}
                className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border mt-1 pt-2"
              >
                {opt.label}
              </div>
            ) : (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full justify-between font-normal",
          !selectedOption && "text-muted-foreground",
          triggerClassName
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
            {options.map((opt) =>
              opt.isSeparator ? (
                <div
                  key={opt.value}
                  className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border mt-2 pt-2"
                >
                  {opt.label}
                </div>
              ) : (
                <DrawerClose asChild key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between py-3 px-2 text-left rounded-md transition-colors",
                      value === opt.value
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check className="h-4 w-4" />}
                  </button>
                </DrawerClose>
              )
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
