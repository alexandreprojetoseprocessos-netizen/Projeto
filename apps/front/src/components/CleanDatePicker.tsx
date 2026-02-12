import { useEffect, useMemo, useRef, useState } from "react";

type CleanDatePickerProps = {
  value: string;
  onChange: (nextValue: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
};

const DATE_PICKER_OPEN_EVENT = "clean-date-picker:open";
const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

const parseInputDate = (value: string): Date | null => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map((part) => Number(part));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

const toInputDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value: string): string => {
  const parsed = parseInputDate(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("pt-BR");
};

export const CleanDatePicker = ({
  value,
  onChange,
  className,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  title
}: CleanDatePickerProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pickerIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `dp-${crypto.randomUUID()}`
      : `dp-${Math.random().toString(36).slice(2)}`
  );
  const selectedDate = useMemo(() => parseInputDate(value), [value]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());

  useEffect(() => {
    if (isOpen) return;
    if (!selectedDate) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const handlePickerOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const openedId = customEvent.detail?.id;
      if (openedId !== pickerIdRef.current) {
        setIsOpen(false);
      }
    };

    window.addEventListener(DATE_PICKER_OPEN_EVENT, handlePickerOpen as EventListener);

    return () => {
      window.removeEventListener(DATE_PICKER_OPEN_EVENT, handlePickerOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
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

  const monthLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { month: "long" }),
    []
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIndex) => ({
        value: monthIndex,
        label:
          monthLabelFormatter
            .format(new Date(2025, monthIndex, 1))
            .replace(".", "")
            .charAt(0)
            .toUpperCase() +
          monthLabelFormatter
            .format(new Date(2025, monthIndex, 1))
            .replace(".", "")
            .slice(1)
      })),
    [monthLabelFormatter]
  );

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

  const goToPreviousMonth = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((current) => current - 1);
      return;
    }
    setViewMonth((current) => current - 1);
  };

  const goToNextMonth = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((current) => current + 1);
      return;
    }
    setViewMonth((current) => current + 1);
  };

  return (
    <div
      className="clean-date-picker"
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className={triggerClassName}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          setIsOpen((current) => {
            const nextOpen = !current;
            if (nextOpen) {
              window.dispatchEvent(
                new CustomEvent(DATE_PICKER_OPEN_EVENT, {
                  detail: { id: pickerIdRef.current },
                })
              );
            }
            return nextOpen;
          });
        }}
        disabled={disabled}
        title={title}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span>{displayValue || placeholder}</span>
        <svg className="clean-date-picker__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 2v3M16 2v3M4 8h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="clean-date-picker__popover" role="dialog" aria-label="Selecionar data">
          <div className="clean-date-picker__header">
            <div className="clean-date-picker__selectors">
              <select
                value={viewMonth}
                onChange={(event) => setViewMonth(Number(event.target.value))}
                className="clean-date-picker__select"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(event) => setViewYear(Number(event.target.value))}
                className="clean-date-picker__select clean-date-picker__select--year"
              >
                {yearOptions.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>
            <div className="clean-date-picker__nav">
              <button type="button" onClick={goToPreviousMonth} aria-label="Mês anterior">
                {"<"}
              </button>
              <button type="button" onClick={goToNextMonth} aria-label="Próximo mês">
                {">"}
              </button>
            </div>
          </div>

          <div className="clean-date-picker__weekdays">
            {WEEKDAY_LABELS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="clean-date-picker__grid">
            {calendarDays.map((day) => {
              const isSelected = selectedValue === day.value;
              const isToday = todayValue === day.value;
              return (
                <button
                  key={`${day.value}-${day.inCurrentMonth ? "in" : "out"}`}
                  type="button"
                  className={[
                    "clean-date-picker__day",
                    day.inCurrentMonth ? "" : "is-outside",
                    isToday ? "is-today" : "",
                    isSelected ? "is-selected" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChange(day.value);
                    setIsOpen(false);
                  }}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="clean-date-picker__footer">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                setIsOpen(false);
              }}
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(todayValue);
                setIsOpen(false);
              }}
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
