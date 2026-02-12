import { useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { toPng } from "html-to-image";

type DiagramNode = {
  id: string;
  label: string;
  children?: DiagramNode[];
};

const MAX_LEVEL = 4;

const DiagramPage = () => {
  const { selectedProject, projectWbsNodes } = useOutletContext<DashboardOutletContext>();
  const projectName = selectedProject?.projectName ?? selectedProject?.name ?? "Projeto";
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const diagramTree = useMemo<DiagramNode>(() => {
    const buildNodes = (nodes: any[], level: number): DiagramNode[] => {
      if (!Array.isArray(nodes) || level > MAX_LEVEL) return [];
      return nodes.map((node, index) => {
        const label =
          String(
            node?.title ??
              node?.name ??
              node?.wbsCode ??
              node?.code ??
              node?.id ??
              `Nível ${String(level).padStart(2, "0")} - ${String(index + 1).padStart(2, "0")}`
          ) || `Nível ${level}`;
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

  const renderNode = (node: DiagramNode, depth: number) => {
    const isRoot = depth === 0;
    const hasChildren = !!node.children?.length;
    const className = [
      "diagram-node",
      isRoot ? "is-root" : "",
      !hasChildren ? "is-leaf" : ""
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <li key={node.id}>
        <div className={className}>{node.label}</div>
        {hasChildren ? <ul>{node.children?.map((child) => renderNode(child, depth + 1))}</ul> : null}
      </li>
    );
  };

  const handleExport = async () => {
    if (!diagramRef.current || isExporting) return;
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
    } catch (error) {
      console.error("Erro ao exportar diagrama", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="diagram-page page-card">
      <header className="page-header diagram-page-header">
        <div className="diagram-header-text">
          <h1>Diagrama</h1>
          <p className="page-subtitle">Estrutura hierárquica do projeto.</p>
        </div>
        <button
          type="button"
          className="btn-secondary diagram-export-button"
          onClick={handleExport}
          disabled={isExporting}
          aria-busy={isExporting}
        >
          {isExporting ? "Salvando..." : "Salvar imagem Diagrama EAD"}
        </button>
      </header>

      <div className="diagram-board" aria-label="Diagrama do projeto" ref={diagramRef}>
        <div className="diagram-tree">
          <ul>{renderNode(diagramTree, 0)}</ul>
        </div>
      </div>
    </section>
  );
};

export default DiagramPage;
