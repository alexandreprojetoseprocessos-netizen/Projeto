import { useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, GitBranch, Layers3, Workflow } from "lucide-react";
import { toPng } from "html-to-image";
import type { DashboardOutletContext } from "../components/DashboardLayout";
import { AppPageHero, AppStateCard } from "../components/AppPageHero";

type DiagramNode = {
  id: string;
  label: string;
  children?: DiagramNode[];
};

const MAX_LEVEL = 4;

const countDiagramNodes = (node: DiagramNode | undefined): number => {
  if (!node) return 0;
  const children = node.children ?? [];
  return 1 + children.reduce((total, child) => total + countDiagramNodes(child), 0);
};

const countDiagramLeaves = (node: DiagramNode | undefined): number => {
  if (!node) return 0;
  const children = node.children ?? [];
  if (!children.length) return 1;
  return children.reduce((total, child) => total + countDiagramLeaves(child), 0);
};

const countDiagramDepth = (node: DiagramNode | undefined): number => {
  if (!node) return 0;
  const children = node.children ?? [];
  if (!children.length) return 1;
  return 1 + Math.max(...children.map((child) => countDiagramDepth(child)));
};

const DiagramPage = () => {
  const { selectedProject, projectWbsNodes } = useOutletContext<DashboardOutletContext>();
  const projectName = selectedProject?.projectName ?? selectedProject?.name ?? "Projeto";
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const hasRealNodes = Array.isArray(projectWbsNodes) && projectWbsNodes.length > 0;

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
              `Nivel ${String(level).padStart(2, "0")} - ${String(index + 1).padStart(2, "0")}`
          ) || `Nivel ${level}`;
        const children = level < MAX_LEVEL ? buildNodes(node?.children ?? [], level + 1) : [];
        return {
          id: String(node?.id ?? `${level}-${index}`),
          label,
          children: children.length ? children : undefined
        };
      });
    };

    if (hasRealNodes) {
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
          label: "Nivel 01 - 01",
          children: [
            {
              id: "lvl-2-1",
              label: "Nivel 02 - 01",
              children: [
                {
                  id: "lvl-3-1",
                  label: "Nivel 03 - 01",
                  children: [
                    { id: "lvl-4-1", label: "Nivel 04 - 01" },
                    { id: "lvl-4-2", label: "Nivel 04 - 02" }
                  ]
                },
                { id: "lvl-3-2", label: "Nivel 03 - 02" }
              ]
            },
            { id: "lvl-2-2", label: "Nivel 02 - 02" }
          ]
        },
        {
          id: "lvl-1-2",
          label: "Nivel 01 - 02",
          children: [
            { id: "lvl-2-3", label: "Nivel 02 - 01" },
            { id: "lvl-2-4", label: "Nivel 02 - 02" }
          ]
        },
        {
          id: "lvl-1-3",
          label: "Nivel 01 - 03"
        }
      ]
    };
  }, [hasRealNodes, projectName, projectWbsNodes]);

  const totalNodes = Math.max(0, countDiagramNodes(diagramTree) - 1);
  const leavesCount = Math.max(0, countDiagramLeaves(diagramTree) - (diagramTree.children?.length ? 0 : 1));
  const depthCount = Math.max(0, countDiagramDepth(diagramTree) - 1);

  const renderNode = (node: DiagramNode, depth: number) => {
    const isRoot = depth === 0;
    const hasChildren = !!node.children?.length;
    const className = ["diagram-node", isRoot ? "is-root" : "", !hasChildren ? "is-leaf" : ""]
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
      <AppPageHero
        className="diagramPageHero"
        kicker="Estrutura visual"
        title="Diagrama"
        subtitle={`Mapa hierarquico da EAP para ${projectName}.`}
        actions={
          <button
            type="button"
            className="btn-secondary diagram-export-button"
            onClick={handleExport}
            disabled={isExporting}
            aria-busy={isExporting}
          >
            <Download size={16} />
            {isExporting ? "Salvando..." : "Salvar imagem"}
          </button>
        }
        stats={[
          {
            label: "Nos",
            value: totalNodes,
            helper: "Itens desenhados no diagrama",
            icon: <GitBranch size={18} />,
            tone: "default"
          },
          {
            label: "Folhas",
            value: leavesCount,
            helper: "Pontos finais da estrutura",
            icon: <Workflow size={18} />,
            tone: "info"
          },
          {
            label: "Profundidade",
            value: depthCount,
            helper: "Niveis renderizados no mapa",
            icon: <Layers3 size={18} />,
            tone: "warning"
          },
          {
            label: "Fonte",
            value: hasRealNodes ? "Projeto" : "Modelo",
            helper: hasRealNodes ? "Estrutura real da EAP" : "Exibindo estrutura base",
            icon: <GitBranch size={18} />,
            tone: hasRealNodes ? "success" : "danger"
          }
        ]}
      />

      {!hasRealNodes ? (
        <AppStateCard
          className="diagramStateCard"
          tone="warning"
          title="Exibindo estrutura base"
          description="Ainda nao ha niveis suficientes na EAP deste projeto. O diagrama mostra um modelo visual para orientar a montagem da estrutura."
        />
      ) : null}

      <div className="diagram-board" aria-label="Diagrama do projeto" ref={diagramRef}>
        <div className="diagram-tree">
          <ul>{renderNode(diagramTree, 0)}</ul>
        </div>
      </div>
    </section>
  );
};

export default DiagramPage;
