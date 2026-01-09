import { jsx as _jsx } from "react/jsx-runtime";
import { STATUS_ORDER, normalizeStatus } from "../utils/status";
export const StatusSelect = ({ value, onChange, disabled, className }) => {
    const selected = normalizeStatus(value);
    return (_jsx("select", { className: className ?? "gp-input", value: selected, onChange: (e) => onChange(e.target.value), disabled: disabled, children: STATUS_ORDER.map((status) => (_jsx("option", { value: status, children: status }, status))) }));
};
