import { useMemo, useState } from 'react';
import { computeNps, getSurveys, npsCategory, DETRACTOR_MAX } from '../../lib/satisfaction';
import { formatDateTime } from '../../lib/format';

export default function SatisfactionSection() {
  // Read once on mount; a manual refresh re-reads localStorage (shared with the
  // Balcão screen in the same browser).
  const [nonce, setNonce] = useState(0);
  const surveys = useMemo(() => getSurveys(), [nonce]);

  const total = surveys.length;
  const nps = computeNps(surveys);
  const detractors = surveys.filter((s) => npsCategory(s.score) === 'detractor');
  const promoters = surveys.filter((s) => npsCategory(s.score) === 'promoter').length;
  const passives = total - detractors.length - promoters;

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Respostas</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card" style={{ borderBottom: '3px solid var(--gold)' }}>
          <div className="stat-label">NPS</div>
          <div className="stat-value">{total > 0 ? nps : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Promotores / Neutros</div>
          <div className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>
            {promoters} / {passives}
          </div>
        </div>
        <div className="stat-card" style={{ borderBottom: '3px solid var(--red)' }}>
          <div className="stat-label">Detratores (≤ {DETRACTOR_MAX})</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{detractors.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Detratores — clientes insatisfeitos</h2>
          <button type="button" className="btn btn-ghost" onClick={() => setNonce((n) => n + 1)}>
            Atualizar
          </button>
        </div>

        {detractors.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', padding: '8px 0' }}>
            Nenhuma nota igual ou abaixo de {DETRACTOR_MAX} registrada. 🎉
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Nota</th>
                <th>O que melhorar</th>
              </tr>
            </thead>
            <tbody>
              {detractors.map((d) => (
                <tr key={d.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(d.createdAt)}</td>
                  <td>
                    <span className="badge badge-red">{d.score}</span>
                  </td>
                  <td>{d.comment ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
