import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
const parseWbsLevel = (code) => {
    const normalized = String(code ?? "").trim();
    if (!normalized)
        return null;
    if (!/^\d+(\.\d+)*$/.test(normalized))
        return null;
    return normalized.split(".").length;
};
const compareDisplayCode = (a, b) => {
    const leftParts = String(a ?? "").split(".").map((part) => Number(part));
    const rightParts = String(b ?? "").split(".").map((part) => Number(part));
    const maxLen = Math.max(leftParts.length, rightParts.length);
    for (let index = 0; index < maxLen; index += 1) {
        const left = Number.isFinite(leftParts[index]) ? leftParts[index] : Number.POSITIVE_INFINITY;
        const right = Number.isFinite(rightParts[index]) ? rightParts[index] : Number.POSITIVE_INFINITY;
        if (left !== right)
            return left - right;
    }
    return String(a).localeCompare(String(b));
};
export const DependenciesDropdown = ({ options, selectedIds, onChange, onApplyDownChain, currentTaskName, currentTaskCode, disabled = false, disabledReason }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const openMenu = () => {
        if (disabled)
            return;
        setIsOpen(true);
    };
    const closeMenu = () => {
        setIsOpen(false);
        buttonRef.current?.focus();
    };
    const handleToggleOption = (id) => {
        if (disabled)
            return;
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((value) => value !== id));
            return;
        }
        onChange([...selectedIds, id]);
    };
    useEffect(() => {
        if (disabled && isOpen) {
            closeMenu();
            return;
        }
        if (!isOpen)
            return undefined;
        const handleEscape = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
            }
        };
        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, disabled]);
    const optionsWithMeta = useMemo(() => options.map((option) => {
        const optionCode = option.displayCode ?? option.wbsCode ?? option.id;
        return {
            ...option,
            optionCode,
            level: parseWbsLevel(optionCode)
        };
    }), [options]);
    const selectedCodes = selectedIds
        .map((id) => optionsWithMeta.find((option) => option.id === id)?.displayCode)
        .filter((code) => Boolean(code));
    let label = "Sem dependencias";
    if (selectedCodes.length === 1) {
        label = `Dep: ${selectedCodes[0]}`;
    }
    else if (selectedCodes.length > 1) {
        const firstTwo = selectedCodes.slice(0, 2).join(", ");
        const rest = selectedCodes.length - 2;
        label = rest > 0 ? `Dep: ${firstTwo} +${rest}` : `Dep: ${firstTwo}`;
    }
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredOptions = optionsWithMeta
        .filter((option) => {
        if (levelFilter === "1")
            return option.level === 1;
        if (levelFilter === "2")
            return option.level === 2;
        if (levelFilter === "3plus")
            return (option.level ?? 0) >= 3;
        return true;
    })
        .filter((option) => {
        if (!normalizedSearch)
            return true;
        const haystack = `${option.optionCode} ${option.name}`.toLowerCase();
        return haystack.includes(normalizedSearch);
    })
        .sort((left, right) => compareDisplayCode(left.optionCode, right.optionCode));
    const normalizedCurrentTaskName = String(currentTaskName ?? "").trim();
    const normalizedCurrentTaskCode = String(currentTaskCode ?? "").trim();
    const currentTaskLabel = normalizedCurrentTaskCode
        ? `${normalizedCurrentTaskCode} - ${normalizedCurrentTaskName || "Tarefa sem nome"}`
        : normalizedCurrentTaskName;
    const addLevelDependencies = (level) => {
        if (disabled)
            return;
        const ids = optionsWithMeta.filter((option) => option.level === level).map((option) => option.id);
        if (!ids.length)
            return;
        onChange(Array.from(new Set([...selectedIds, ...ids])));
    };
    return (_jsxs("div", { className: "dependencies-dropdown", ref: containerRef, children: [_jsxs("button", { ref: buttonRef, type: "button", onClick: (event) => {
                    event.stopPropagation();
                    if (isOpen) {
                        closeMenu();
                    }
                    else {
                        openMenu();
                    }
                }, className: `dependencies-dropdown__trigger${isOpen ? " is-open" : ""}`, "aria-expanded": isOpen, disabled: disabled, title: disabled ? disabledReason : undefined, children: [_jsx("span", { className: "dependencies-dropdown__label-text", children: label }), _jsx("span", { className: "dependencies-dropdown__caret", "aria-hidden": "true", children: "v" })] }), isOpen &&
                createPortal(_jsx("div", { className: "dependencies-menu-overlay", ref: menuRef, onMouseDown: closeMenu, children: _jsxs("div", { className: "dependencies-dropdown__panel dependencies-dropdown__panel--modal", onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "dependencies-dropdown__header", children: [_jsxs("div", { children: [_jsx("h4", { children: "Selecione predecessoras" }), _jsx("p", { children: "Marque as tarefas das quais esta atividade depende." }), currentTaskLabel && (_jsxs("div", { className: "dependencies-dropdown__current-task", title: currentTaskLabel, children: [_jsx("span", { className: "dependencies-dropdown__current-task-label", children: "Linha atual" }), _jsx("strong", { className: "dependencies-dropdown__current-task-value", children: currentTaskLabel })] }))] }), _jsx("button", { type: "button", className: "dependencies-dropdown__close", onClick: closeMenu, "aria-label": "Fechar", children: "x" })] }), _jsxs("div", { className: "dependencies-dropdown__toolbar", children: [_jsxs("span", { className: "dependencies-dropdown__count", children: [selectedIds.length, " selecionada", selectedIds.length === 1 ? "" : "s"] }), _jsxs("div", { className: "dependencies-dropdown__quick-actions", children: [_jsx("button", { type: "button", className: "dependencies-dropdown__chip", onClick: () => addLevelDependencies(1), children: "Nivel 1" }), _jsx("button", { type: "button", className: "dependencies-dropdown__chip", onClick: () => addLevelDependencies(2), children: "Nivel 2" }), _jsx("button", { type: "button", className: "dependencies-dropdown__chip", onClick: () => onChange([]), children: "Limpar" })] })] }), onApplyDownChain && !disabled && (_jsx("button", { type: "button", className: "dependencies-dropdown__chain", onClick: () => {
                                    onApplyDownChain();
                                    closeMenu();
                                }, children: "Dependencia para baixo (todos os niveis)" })), _jsx("div", { className: "dependencies-dropdown__search", children: _jsx("input", { type: "search", placeholder: "Pesquisar tarefa...", value: searchTerm, onChange: (event) => setSearchTerm(event.target.value), autoFocus: true }) }), _jsxs("div", { className: "dependencies-dropdown__filters", children: [_jsx("button", { type: "button", className: `dependencies-dropdown__chip ${levelFilter === "all" ? "is-active" : ""}`, onClick: () => setLevelFilter("all"), children: "Todos" }), _jsx("button", { type: "button", className: `dependencies-dropdown__chip ${levelFilter === "1" ? "is-active" : ""}`, onClick: () => setLevelFilter("1"), children: "Nivel 1" }), _jsx("button", { type: "button", className: `dependencies-dropdown__chip ${levelFilter === "2" ? "is-active" : ""}`, onClick: () => setLevelFilter("2"), children: "Nivel 2" }), _jsx("button", { type: "button", className: `dependencies-dropdown__chip ${levelFilter === "3plus" ? "is-active" : ""}`, onClick: () => setLevelFilter("3plus"), children: "Nivel 3+" })] }), _jsxs("div", { className: "dependencies-dropdown__list", children: [filteredOptions.map((option) => (_jsxs("label", { className: "dependencies-dropdown__item", title: `${option.optionCode} - ${option.name}`, children: [_jsx("input", { type: "checkbox", checked: selectedIds.includes(option.id), onChange: () => handleToggleOption(option.id) }), _jsxs("span", { className: "dependencies-dropdown__label", children: [_jsx("span", { className: "dependencies-dropdown__code", children: option.optionCode }), _jsx("span", { className: "dependencies-dropdown__name", children: option.name })] })] }, option.id))), filteredOptions.length === 0 && (_jsx("p", { className: "dependencies-dropdown__empty", children: "Nao ha outras tarefas para selecionar como predecessoras." }))] }), _jsx("div", { className: "dependencies-dropdown__footer", children: _jsx("button", { type: "button", className: "dependencies-dropdown__done", onClick: closeMenu, children: "Concluir" }) })] }) }), document.body)] }));
};
