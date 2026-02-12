import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
export const CleanFilterSelect = ({ value, options, onChange, ariaLabel, size = "default", }) => {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);
    const selected = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);
    useEffect(() => {
        if (!isOpen)
            return;
        const handleDocumentMouseDown = (event) => {
            const target = event.target;
            if (rootRef.current && target && !rootRef.current.contains(target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleDocumentMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleDocumentMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);
    return (_jsxs("div", { ref: rootRef, className: `clean-filter-select ${size === "small" ? "clean-filter-select--small" : ""}`, onClick: (event) => event.stopPropagation(), onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("button", { type: "button", className: `clean-filter-select__trigger ${isOpen ? "is-open" : ""}`, onClick: (event) => {
                    event.stopPropagation();
                    setIsOpen((current) => !current);
                }, "aria-label": ariaLabel, "aria-haspopup": "listbox", "aria-expanded": isOpen, children: [_jsx("span", { className: "clean-filter-select__value", title: selected?.label ?? "", children: selected?.label ?? "Todos" }), _jsx("span", { className: "clean-filter-select__caret", "aria-hidden": "true", children: "v" })] }), isOpen && (_jsx("div", { className: "clean-filter-select__menu", role: "listbox", "aria-label": ariaLabel, children: options.map((option) => {
                    const isSelected = option.value === value;
                    return (_jsx("button", { type: "button", role: "option", "aria-selected": isSelected, className: `clean-filter-select__option ${isSelected ? "is-selected" : ""}`, onClick: (event) => {
                            event.stopPropagation();
                            onChange(option.value);
                            setIsOpen(false);
                        }, title: option.label, children: option.label }, option.value));
                }) }))] }));
};
