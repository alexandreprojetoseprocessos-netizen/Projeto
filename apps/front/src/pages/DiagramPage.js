import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toPng } from "html-to-image";
const MAX_LEVEL = 4;
const DiagramPage = () => {
    const { selectedProject, projectWbsNodes } = useOutletContext();
    const projectName = selectedProject?.projectName ?? selectedProject?.name ?? "Projeto";
    const diagramRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const diagramTree = useMemo(() => {
        const buildNodes = (nodes, level) => {
            if (!Array.isArray(nodes) || level > MAX_LEVEL)
                return [];
            return nodes.map((node, index) => {
                const label = String(node?.title ??
                    node?.name ??
                    node?.wbsCode ??
                    node?.code ??
                    node?.id ??
                    `Nível ${String(level).padStart(2, "0")} - ${String(index + 1).padStart(2, "0")}`) || `Nível ${level}`;
                const children = level < MAX_LEVEL ? buildNodes(node?.children ?? [], level + 1) : [];
                return {
                    id: String(node?.id ?? `${level}-${index}`),
                    label,
                    children: children.length ? children : undefined
                };
            });
        };
        if (Array.isArray(projectWbsNodes) && projectWbsNodes.length) {
            return {
                id: "root",
                label: projectName,
                children: buildNodes(projectWbsNodes, 1)
            };
        }
        return {
            id: "root",
            label: projectName,
            children: [
                {
                    id: "lvl-1-1",
                    label: "Nível 01 - 01",
                    children: [
                        {
                            id: "lvl-2-1",
                            label: "Nível 02 - 01",
                            children: [
                                {
                                    id: "lvl-3-1",
                                    label: "Nível 03 - 01",
                                    children: [
                                        { id: "lvl-4-1", label: "Nível 04 - 01" },
                                        { id: "lvl-4-2", label: "Nível 04 - 02" }
                                    ]
                                },
                                { id: "lvl-3-2", label: "Nível 03 - 02" }
                            ]
                        },
                        { id: "lvl-2-2", label: "Nível 02 - 02" }
                    ]
                },
                {
                    id: "lvl-1-2",
                    label: "Nível 01 - 02",
                    children: [
                        { id: "lvl-2-3", label: "Nível 02 - 01" },
                        { id: "lvl-2-4", label: "Nível 02 - 02" }
                    ]
                },
                {
                    id: "lvl-1-3",
                    label: "Nível 01 - 03"
                }
            ]
        };
    }, [projectName, projectWbsNodes]);
    const renderNode = (node, depth) => {
        const isRoot = depth === 0;
        const hasChildren = !!node.children?.length;
        const className = [
            "diagram-node",
            isRoot ? "is-root" : "",
            !hasChildren ? "is-leaf" : ""
        ]
            .filter(Boolean)
            .join(" ");
        return (_jsxs("li", { children: [_jsx("div", { className: className, children: node.label }), hasChildren ? _jsx("ul", { children: node.children?.map((child) => renderNode(child, depth + 1)) }) : null] }, node.id));
    };
    const handleExport = async () => {
        if (!diagramRef.current || isExporting)
            return;
        setIsExporting(true);
        try {
            const node = diagramRef.current;
            const width = node.scrollWidth;
            const height = node.scrollHeight;
            const dataUrl = await toPng(node, {
                cacheBust: true,
                backgroundColor: "#ffffff",
                width,
                height,
                style: {
                    width: `${width}px`,
                    height: `${height}px`
                }
            });
            const safeName = projectName.replace(/[\\/:*?"<>|]+/g, "").trim() || "diagrama";
            const link = document.createElement("a");
            link.download = `diagrama-ead-${safeName}.png`;
            link.href = dataUrl;
            link.click();
        }
        catch (error) {
            console.error("Erro ao exportar diagrama", error);
        }
        finally {
            setIsExporting(false);
        }
    };
    return (_jsxs("section", { className: "diagram-page page-card", children: [_jsxs("header", { className: "page-header diagram-page-header", children: [_jsxs("div", { className: "diagram-header-text", children: [_jsx("h1", { children: "Diagrama" }), _jsx("p", { className: "page-subtitle", children: "Estrutura hier\u00E1rquica do projeto." })] }), _jsx("button", { type: "button", className: "btn-secondary diagram-export-button", onClick: handleExport, disabled: isExporting, "aria-busy": isExporting, children: isExporting ? "Salvando..." : "Salvar imagem Diagrama EAD" })] }), _jsx("div", { className: "diagram-board", "aria-label": "Diagrama do projeto", ref: diagramRef, children: _jsx("div", { className: "diagram-tree", children: _jsx("ul", { children: renderNode(diagramTree, 0) }) }) })] }));
};
export default DiagramPage;
