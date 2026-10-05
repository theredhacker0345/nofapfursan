import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  /** `inline` keeps the chrome around the failure (used per route). */
  variant?: "full" | "inline";
  title?: string;
  description?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Themed, recoverable, and quiet. The old screen was a black-on-white terminal
 * mock ("CATASTROPHIC FAILURE / Reboot Application") that ignored the active
 * theme entirely and offered no in-place retry — so an offline lazy-route
 * failure left the user with nothing but a relaunch.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught render error:", error, errorInfo);
  }

  private reset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    const {
      variant = "full",
      title = "Something broke on this screen",
      description = "Your records are untouched. Try again — if it keeps happening, reopening the app will clear it.",
    } = this.props;

    const body = (
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-6 px-5 py-12 text-center">
        <ShieldAlert className="h-9 w-9 text-danger" strokeWidth={1.75} aria-hidden="true" />

        <div className="space-y-2">
          <h1 className="text-title font-semibold text-ink">{title}</h1>
          <p className="mx-auto max-w-prose text-body-s text-ink-muted">{description}</p>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink px-5 text-label uppercase text-bg transition-opacity hover:opacity-90"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-5 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reopen app
          </button>
        </div>
      </div>
    );

    if (variant === "inline") return <div className="bg-bg">{body}</div>;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        {body}
      </div>
    );
  }
}

export default ErrorBoundary;