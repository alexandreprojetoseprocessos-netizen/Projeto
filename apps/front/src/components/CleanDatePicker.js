import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
const DATE_PICKER_OPEN_EVENT = "clean-date-picker:open";
const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const parseInputDate = (value) => {
    const normalized = String(value ?? "").trim();
    if (!normalized)
        return null;
    const [year, month, day] = normalized.split("-").map((part) => Number(part));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day))
        return null;
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day) {
        return null;
    }
    return parsed;
};
const toInputDate = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
const formatDisplayDate = (value) => {
    const parsed = parseInputDate(value);
    if (!parsed)
        return "";
    return parsed.toLocaleDateString("pt-BR");
};
export const CleanDatePicker = ({ value, onChange, className, placeholder = "dd/mm/aaaa", disabled = false, title }) => {
    const rootRef = useRef(null);
    const pickerIdRef = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `dp-${crypto.randomUUID()}`
        : `dp-${Math.random().toString(36).slice(2)}`);
    const selectedDate = useMemo(() => parseInputDate(value), [value]);
    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
    useEffect(() => {
        if (isOpen)
            return;
        if (!selectedDate)
            return;
        setViewYear(selectedDate.getFullYear());
        setViewMonth(selectedDate.getMonth());
    }, [isOpen, selectedDate]);
    useEffect(() => {
        const handlePickerOpen = (event) => {
            const customEvent = event;
            const openedId = customEvent.detail?.id;
            if (openedId !== pickerIdRef.current) {
                setIsOpen(false);
            }
        };
        window.addEventListener(DATE_PICKER_OPEN_EVENT, handlePickerOpen);
        return () => {
            window.removeEventListener(DATE_PICKER_OPEN_EVENT, handlePickerOpen);
        };
    }, []);
    useEffect(() => {
        if (!isOpen)
            return;
        const handleMouseDown = (event) => {
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
        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);
    const monthLabelFormatter = useMemo(() => new Intl.DateTimeFormat("pt-BR", { month: "long" }), []);
    const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, monthIndex) => ({
        value: monthIndex,
        label: monthLabelFormatter
            .format(new Date(2025, monthIndex, 1))
            .replace(".", "")
            .charAt(0)
            .toUpperCase() +
            monthLabelFormatter
                .format(new Date(2025, monthIndex, 1))
                .replace(".", "")
                .slice(1)
    })), [monthLabelFormatter]);
    const yearOptions = useMemo(() => {
        const baseYear = today.getFullYear();
        return Array.from({ length: 31 }, (_, index) => baseYear - 15 + index);
    }, [today]);
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const offset = firstDay.getDay();
        const gridStart = new Date(viewYear, viewMonth, 1 - offset);
        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
            return {
                date,
                value: toInputDate(date),
                inCurrentMonth: date.getMonth() === viewMonth
            };
        });
    }, [viewMonth, viewYear]);
    const selectedValue = selectedDate ? toInputDate(selectedDate) : "";
    const todayValue = toInputDate(today);
    const displayValue = formatDisplayDate(value);
    const triggerClassName = [
        "clean-date-picker__trigger",
        className,
        !displayValue ? "is-empty" : ""
    ]
        .filter(Boolean)
        .join(" ");
    const goToPreviousMonth = (event) => {
        event.stopPropagation();
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((current) => current - 1);
            return;
        }
        setViewMonth((current) => current - 1);
    };
    const goToNextMonth = (event) => {
        event.stopPropagation();
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((current) => current + 1);
            return;
        }
        setViewMonth((current) => current + 1);
    };
    return (_jsxs("div", { className: "clean-date-picker", ref: rootRef, onClick: (event) => event.stopPropagation(), onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("button", { type: "button", className: triggerClassName, onClick: (event) => {
                    event.stopPropagation();
                    if (disabled)
                        return;
                    setIsOpen((current) => {
                        const nextOpen = !current;
                        if (nextOpen) {
                            window.dispatchEvent(new CustomEvent(DATE_PICKER_OPEN_EVENT, {
                                detail: { id: pickerIdRef.current },
                            }));
                        }
                        return nextOpen;
                    });
                }, disabled: disabled, title: title, "aria-haspopup": "dialog", "aria-expanded": isOpen, children: [_jsx("span", { children: displayValue || placeholder }), _jsx("svg", { className: "clean-date-picker__icon", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M8 2v3M16 2v3M4 8h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), isOpen && (_jsxs("div", { className: "clean-date-picker__popover", role: "dialog", "aria-label": "Selecionar data", children: [_jsxs("div", { className: "clean-date-picker__header", children: [_jsxs("div", { className: "clean-date-picker__selectors", children: [_jsx("select", { value: viewMonth, onChange: (event) => setViewMonth(Number(event.target.value)), className: "clean-date-picker__select", children: monthOptions.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) }), _jsx("select", { value: viewYear, onChange: (event) => setViewYear(Number(event.target.value)), className: "clean-date-picker__select clean-date-picker__select--year", children: yearOptions.map((yearOption) => (_jsx("option", { value: yearOption, children: yearOption }, yearOption))) })] }), _jsxs("div", { className: "clean-date-picker__nav", children: [_jsx("button", { type: "button", onClick: goToPreviousMonth, "aria-label": "M\u00EAs anterior", children: "<" }), _jsx("button", { type: "button", onClick: goToNextMonth, "aria-label": "Pr\u00F3ximo m\u00EAs", children: ">" })] })] }), _jsx("div", { className: "clean-date-picker__weekdays", children: WEEKDAY_LABELS.map((weekday) => (_jsx("span", { children: weekday }, weekday))) }), _jsx("div", { className: "clean-date-picker__grid", children: calendarDays.map((day) => {
                            const isSelected = selectedValue === day.value;
                            const isToday = todayValue === day.value;
                            return (_jsx("button", { type: "button", className: [
                                    "clean-date-picker__day",
                                    day.inCurrentMonth ? "" : "is-outside",
                                    isToday ? "is-today" : "",
                                    isSelected ? "is-selected" : ""
                                ]
                                    .filter(Boolean)
                                    .join(" "), onClick: (event) => {
                                    event.stopPropagation();
                                    onChange(day.value);
                                    setIsOpen(false);
                                }, children: day.date.getDate() }, `${day.value}-${day.inCurrentMonth ? "in" : "out"}`));
                        }) }), _jsxs("div", { className: "clean-date-picker__footer", children: [_jsx("button", { type: "button", onClick: (event) => {
                                    event.stopPropagation();
                                    onChange("");
                                    setIsOpen(false);
                                }, children: "Limpar" }), _jsx("button", { type: "button", onClick: (event) => {
                                    event.stopPropagation();
                                    onChange(todayValue);
                                    setIsOpen(false);
                                }, children: "Hoje" })] })] }))] }));
};
