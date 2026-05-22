import { useState } from 'react';
import { useNotif } from '../../store/notifContext';
import { addSurvey, DETRACTOR_MAX } from '../../lib/satisfaction';

const SCORES = Array.from({ length: 11 }, (_, i) => i); // 0..10

export default function SatisfactionSection() {
  const { notify } = useNotif();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const isDetractor = score != null && score <= DETRACTOR_MAX;

  function reset() {
    setScore(null);
    setComment('');
    setDone(false);
  }

  function handleSubmit() {
    if (score == null) return;
    addSurvey(score, isDetractor ? comment : undefined);
    setDone(true);
    notify('Obrigado pela sua avaliação!');
  }

  if (done) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <h2 className="card-title" style={{ marginBottom: 8 }}>
          Obrigado pela sua avaliação! 🎉
        </h2>
        <p style={{ color: 'var(--gray-400)', marginBottom: 20 }}>
          Sua opinião nos ajuda a melhorar.
        </p>
        <button type="button" className="btn btn-primary" onClick={reset}>
          Nova avaliação
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Pesquisa de Satisfação</h2>
      </div>

      <p style={{ fontSize: 'var(--fs-lg)', marginBottom: 16 }}>
        De 0 a 10, o quanto você recomendaria nosso restaurante a um amigo?
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {SCORES.map((n) => {
          const sel = score === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              aria-pressed={sel}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 'var(--fs-lg)',
                border: sel ? '2px solid var(--gold)' : '1.5px solid var(--gray-200)',
                background: sel ? 'var(--gold)' : 'var(--white)',
                color: sel ? 'var(--white)' : 'var(--dark)',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--fs-xs)',
          color: 'var(--gray-400)',
          marginBottom: 20,
          maxWidth: 560,
        }}
      >
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>

      {isDetractor && (
        <div className="form-group">
          <label className="form-label">O que podemos melhorar?</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte o que não foi bom (opcional)"
          />
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={score == null}
      >
        Enviar avaliação
      </button>
    </div>
  );
}
