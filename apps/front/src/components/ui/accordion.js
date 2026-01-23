import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
const AccordionContext = React.createContext(null);
const AccordionItemContext = React.createContext(null);
export const Accordion = React.forwardRef(({ className, type = "single", collapsible = false, value, defaultValue, onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? (type === "multiple" ? [] : null));
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const setValue = React.useCallback((next) => {
        if (!isControlled) {
            setInternalValue(next);
        }
        onValueChange?.(next);
    }, [isControlled, onValueChange]);
    return (_jsx(AccordionContext.Provider, { value: { type, value: currentValue, collapsible, setValue }, children: _jsx("div", { ref: ref, className: cn(className), ...props }) }));
});
Accordion.displayName = "Accordion";
export const AccordionItem = React.forwardRef(({ className, value, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) {
        throw new Error("AccordionItem must be used within Accordion");
    }
    const isOpen = context.type === "multiple"
        ? Array.isArray(context.value) && context.value.includes(value)
        : context.value === value;
    return (_jsx(AccordionItemContext.Provider, { value: { value }, children: _jsx("div", { ref: ref, "data-state": isOpen ? "open" : "closed", className: cn(className), ...props }) }));
});
AccordionItem.displayName = "AccordionItem";
export const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);
    if (!context || !item) {
        throw new Error("AccordionTrigger must be used within AccordionItem");
    }
    const isOpen = context.type === "multiple"
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
    return (_jsxs("button", { ref: ref, type: "button", onClick: toggle, "aria-expanded": isOpen, "data-state": isOpen ? "open" : "closed", className: cn("flex w-full items-center justify-between border-0 bg-transparent py-4 transition-colors", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", "ring-offset-background", className), ...props, children: [_jsx("span", { children: children }), _jsx(ChevronDown, { className: cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180"), "aria-hidden": "true" })] }));
});
AccordionTrigger.displayName = "AccordionTrigger";
export const AccordionContent = React.forwardRef(({ className, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);
    if (!context || !item) {
        throw new Error("AccordionContent must be used within AccordionItem");
    }
    const isOpen = context.type === "multiple"
        ? Array.isArray(context.value) && context.value.includes(item.value)
        : context.value === item.value;
    return (_jsx("div", { ref: ref, "data-state": isOpen ? "open" : "closed", className: cn("pb-4 pt-0", className), hidden: !isOpen, ...props }));
});
AccordionContent.displayName = "AccordionContent";
