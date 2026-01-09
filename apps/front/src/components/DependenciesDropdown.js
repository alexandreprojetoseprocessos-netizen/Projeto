import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
export const DependenciesDropdown = ({ options, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState(null);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const handleToggle = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const width = Math.max(260, rect.width);
            setMenuPosition({
                top: rect.bottom + 6,
                left: rect.left,
                width
            });
        }
        setIsOpen((prev) => !prev);
    };
    const handleToggleOption = (id) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((value) => value != id));
        }
        else {
            onChange([...selectedIds, id]);
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            const insideButton = containerRef.current?.contains(target);
            const insideMenu = menuRef.current?.contains(target);
            if (!insideButton && !insideMenu) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => setIsOpen(false);
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [isOpen]);
    const selectedCodes = selectedIds
        .map((id) => options.find((opt) => opt.id === id)?.displayCode)
        .filter((code) => Boolean(code));
    let label = "Sem dependências";
    if (selectedCodes.length === 1) {
        label = `Dep: ${selectedCodes[0]}`;
    }
    else if (selectedCodes.length > 1) {
        const firstTwo = selectedCodes.slice(0, 2).join(", ");
        const rest = selectedCodes.length - 2;
        label = rest > 0 ? `Dep: ${firstTwo} +${rest}` : `Dep: ${firstTwo}`;
    }
    return (_jsxs("div", { className: "dependencies-dropdown", ref: containerRef, children: [_jsxs("button", { ref: buttonRef, type: "button", onClick: (e) => {
                    e.stopPropagation();
                    handleToggle();
                }, className: `dependencies-dropdown__trigger${isOpen ? " is-open" : ""}`, "aria-expanded": isOpen, children: [_jsx("span", { className: "dependencies-dropdown__label-text", children: label }), _jsx("span", { className: "dependencies-dropdown__caret", "aria-hidden": "true", children: "v" })] }), isOpen &&
                menuPosition &&
                createPortal(_jsx("div", { className: "dependencies-menu-overlay", style: {
                        position: "fixed",
                        top: menuPosition.top,
                        left: menuPosition.left,
                        width: menuPosition.width,
                        zIndex: 9999
                    }, ref: menuRef, children: _jsxs("div", { className: "dependencies-dropdown__panel", children: [_jsxs("div", { className: "dependencies-dropdown__header", children: [_jsx("h4", { children: "Selecione predecessoras" }), _jsx("p", { children: "Marque as tarefas das quais esta atividade depende." })] }), _jsxs("div", { className: "dependencies-dropdown__list", children: [options.map((opt) => {
                                        const optionCode = opt.displayCode ?? opt.wbsCode ?? opt.id;
                                        return (_jsxs("label", { className: "dependencies-dropdown__item", title: `${optionCode} - ${opt.name}`, children: [_jsx("input", { type: "checkbox", checked: selectedIds.includes(opt.id), onChange: () => handleToggleOption(opt.id) }), _jsxs("span", { className: "dependencies-dropdown__label", children: [_jsx("span", { className: "dependencies-dropdown__code", children: optionCode }), _jsx("span", { className: "dependencies-dropdown__name", children: opt.name })] })] }, opt.id));
                                    }), options.length === 0 && (_jsx("p", { className: "dependencies-dropdown__empty", children: "N\u00E3o h\u00E1 outras tarefas para selecionar como predecessoras." }))] })] }) }), document.body)] }));
};
