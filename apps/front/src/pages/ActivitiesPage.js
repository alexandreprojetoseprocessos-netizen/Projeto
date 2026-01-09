import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useOutletContext } from "react-router-dom";
const formatShortDate = (value) => {
    if (!value)
        return "";
    try {
        return new Date(value).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short"
        });
    }
    catch {
        return "";
    }
};
export const ActivitiesPage = () => {
    const { comments, commentsError } = useOutletContext();
    const activityItems = (comments ?? []).map((comment) => ({
        id: comment.id,
        author: comment.author?.name ?? comment.authorName ?? "Colaborador",
        role: comment.author?.role ?? comment.authorRole ?? "Equipe",
        body: comment.body ?? comment.message,
        createdAt: comment.createdAt ?? new Date().toISOString()
    }));
    return (_jsxs("section", { className: "activities-page", children: [_jsxs("header", { className: "page-header", children: [_jsx("h1", { children: "Atividades" }), commentsError && _jsx("p", { className: "error-text", children: commentsError })] }), _jsx("div", { className: "activity-panel", children: _jsxs("article", { className: "card", children: [_jsx("div", { className: "card-header", children: _jsx("h3", { children: "Timeline de atividades" }) }), activityItems.length ? (_jsx("ul", { className: "activity-timeline", children: activityItems.map((activity) => (_jsxs("li", { children: [_jsx("div", { className: "activity-avatar", children: activity.author?.slice(0, 2).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: activity.author }), _jsx("span", { children: activity.role }), _jsx("p", { children: activity.body }), _jsx("small", { children: formatShortDate(activity.createdAt) })] })] }, activity.id))) })) : (_jsx("p", { className: "muted", children: "Nenhuma atividade registrada." }))] }) })] }));
};
export default ActivitiesPage;
