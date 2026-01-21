import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionType = "single" | "multiple";
type AccordionValue = string | string[] | null;

type AccordionContextValue = {
  type: AccordionType;
  value: AccordionValue;
  collapsible: boolean;
  setValue: (next: AccordionValue) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<{ value: string } | null>(null);

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue"> {
  type?: AccordionType;
  collapsible?: boolean;
  value?: AccordionValue;
  defaultValue?: AccordionValue;
  onValueChange?: (value: AccordionValue) => void;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    { className, type = "single", collapsible = false, value, defaultValue, onValueChange, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<AccordionValue>(
      defaultValue ?? (type === "multiple" ? [] : null)
    );
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const setValue = React.useCallback(
      (next: AccordionValue) => {
        if (!isControlled) {
          setInternalValue(next);
        }
        onValueChange?.(next);
      },
      [isControlled, onValueChange]
    );

    return (
      <AccordionContext.Provider value={{ type, value: currentValue, collapsible, setValue }}>
        <div ref={ref} className={cn(className)} {...props} />
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = "Accordion";

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
      throw new Error("AccordionItem must be used within Accordion");
    }

    const isOpen =
      context.type === "multiple"
        ? Array.isArray(context.value) && context.value.includes(value)
        : context.value === value;

    return (
      <AccordionItemContext.Provider value={{ value }}>
        <div
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          className={cn(className)}
          {...props}
        />
      </AccordionItemContext.Provider>
    );
  }
);

AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);
    if (!context || !item) {
      throw new Error("AccordionTrigger must be used within AccordionItem");
    }

    const isOpen =
      context.type === "multiple"
        ? Array.isArray(context.value) && context.value.includes(item.value)
        : context.value === item.value;

    const toggle = () => {
      if (context.type === "multiple") {
        const current = Array.isArray(context.value) ? context.value : [];
        const next = isOpen
          ? current.filter((value) => value !== item.value)
          : [...current, item.value];
        context.setValue(next);
        return;
      }

      if (isOpen && context.collapsible) {
        context.setValue(null);
        return;
      }
      context.setValue(item.value);
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "flex w-full items-center justify-between border-0 bg-transparent py-4 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "ring-offset-background",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>
    );
  }
);

AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);
    if (!context || !item) {
      throw new Error("AccordionContent must be used within AccordionItem");
    }

    const isOpen =
      context.type === "multiple"
        ? Array.isArray(context.value) && context.value.includes(item.value)
        : context.value === item.value;

    return (
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        className={cn("pb-4 pt-0", className)}
        hidden={!isOpen}
        {...props}
      />
    );
  }
);

AccordionContent.displayName = "AccordionContent";
