interface AsyncStateProps {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}

// Renders a loading / error / empty placeholder. Returns null when there is
// data to show (loading=false, no error, not empty).
export default function AsyncState({
  loading,
  error,
  empty,
  emptyText = 'Nada por aqui ainda.',
  onRetry,
}: AsyncStateProps) {
  if (loading) {
    return (
      <div className="loading-wrap">
        <span className="spinner" /> Carregando…
      </div>
    );
  }
  if (error) {
    return (
      <div className="empty-state">
        <h3>Ops, algo deu errado</h3>
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="btn btn-outline" style={{ marginTop: 16 }} onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="empty-state">
        <h3>Vazio</h3>
        <p>{emptyText}</p>
      </div>
    );
  }
  return null;
}
