import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, RotateCcw } from "lucide-react";
import { AppStateCard } from "./AppPageHero";
import { reportClientError, type ClientErrorEntry } from "../utils/clientErrorReporter";

type AppRouteBoundaryProps = {
  children: ReactNode;
  routeLabel?: string;
};

type AppRouteBoundaryInnerProps = AppRouteBoundaryProps & {
  pathname: string;
};

type AppRouteBoundaryState = {
  hasError: boolean;
  errorEntry: ClientErrorEntry | null;
};

const RouteErrorFallback = ({
  routeLabel,
  pathname,
  errorEntry,
  onRetry
}: {
  routeLabel?: string;
  pathname: string;
  errorEntry: ClientErrorEntry | null;
  onRetry: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <section className="route-loading-state route-error-state">
      <AppStateCard
        className="route-error-card"
        tone="danger"
        title={`Falha ao abrir ${routeLabel ?? "esta área"}`}
        description={
          <>
            <span>O front bloqueou a tela para evitar uma interface quebrada.</span>
            <span className="route-error-card__meta">Rota atual: {pathname}</span>
            {errorEntry?.id ? <span className="route-error-card__meta">Evento: {errorEntry.id}</span> : null}
          </>
        }
        action={
          <div className="route-error-actions">
            <button type="button" className="btn-primary" onClick={onRetry}>
              <RotateCcw size={16} />
              Tentar novamente
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard size={16} />
              Ir ao dashboard
            </button>
            <button type="button" className="button-outline" onClick={() => window.location.reload()}>
              <AlertTriangle size={16} />
              Recarregar página
            </button>
          </div>
        }
      />
    </section>
  );
};

class AppRouteBoundaryInner extends Component<AppRouteBoundaryInnerProps, AppRouteBoundaryState> {
  state: AppRouteBoundaryState = {
    hasError: false,
    errorEntry: null
  };

  static getDerivedStateFromError() {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorEntry = reportClientError("route.boundary", error, {
      pathname: this.props.pathname,
      routeLabel: this.props.routeLabel,
      componentStack: errorInfo.componentStack
    });

    this.setState({ errorEntry });
  }

  componentDidUpdate(prevProps: AppRouteBoundaryInnerProps) {
    if (prevProps.pathname !== this.props.pathname && this.state.hasError) {
      this.setState({
        hasError: false,
        errorEntry: null
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      errorEntry: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback
          routeLabel={this.props.routeLabel}
          pathname={this.props.pathname}
          errorEntry={this.state.errorEntry}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export const AppRouteBoundary = ({ children, routeLabel }: AppRouteBoundaryProps) => {
  const location = useLocation();

  return (
    <AppRouteBoundaryInner pathname={location.pathname} routeLabel={routeLabel}>
      {children}
    </AppRouteBoundaryInner>
  );
};
