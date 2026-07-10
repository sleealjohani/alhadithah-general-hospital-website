import { RefreshCcw, TriangleAlert } from "lucide-react";

type ErrorStateProps = {
  title: string;
  description?: string;
  retryLabel: string;
  onRetry: () => void;
};

export function ErrorState({ title, description, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <div className="state-panel state-error" role="alert">
      <span className="state-icon" aria-hidden="true">
        <TriangleAlert size={28} />
      </span>
      <p className="state-title">{title}</p>
      {description ? <p className="state-description">{description}</p> : null}
      <button type="button" className="btn btn-secondary" onClick={onRetry}>
        <RefreshCcw size={16} />
        {retryLabel}
      </button>
    </div>
  );
}
