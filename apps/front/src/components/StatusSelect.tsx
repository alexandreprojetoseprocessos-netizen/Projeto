import React from "react";
import { STATUS_ORDER, normalizeStatus } from "../utils/status";

type StatusSelectProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export const StatusSelect: React.FC<StatusSelectProps> = ({ value, onChange, disabled, className }) => {
  const selected = normalizeStatus(value);

  return (
    <select
      className={className ?? "gp-input"}
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
};
