import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "text-foreground",
};
export const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => (_jsx("span", { ref: ref, className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background", variantClasses[variant], className), ...props })));
Badge.displayName = "Badge";
