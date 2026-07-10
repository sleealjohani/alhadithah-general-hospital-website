import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryState = { hasError: boolean };

/* Last-resort boundary: a friendly bilingual page instead of a blank screen
   or a stack trace. Rendered outside the providers, so it can't rely on the
   portal context — both languages are shown side by side. */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="state-panel state-error error-boundary-page">
        <p className="state-title">حدث خطأ غير متوقع</p>
        <p className="state-description">
          نعتذر عن الإزعاج — أعد تحميل الصفحة للمتابعة.
          <br />
          Something went wrong. Please reload the page to continue.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          إعادة التحميل / Reload
        </button>
      </main>
    );
  }
}
