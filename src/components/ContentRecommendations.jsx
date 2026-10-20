// Colocar em: src/components/ContentRecommendations.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Async, Card } from './ui';
import { useAsync } from '../hooks/useAsync';
import { list } from '../utils/format';
import {
  getRecommendations,
  refreshRecommendations,
  registerClick,
  registerShown,
} from '../services/recommendationsApi';

/** Envia "visto" em lote: junta os ids que ficaram visíveis e manda 1 request. */
function useShownTracker(resetKey) {
  const seen = useRef(new Set());
  const pending = useRef(new Set());
  const timer = useRef(null);

  useEffect(() => {
    seen.current.clear();
    pending.current.clear();
  }, [resetKey]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback((id) => {
    if (seen.current.has(id) || pending.current.has(id)) return;
    pending.current.add(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const ids = [...pending.current];
      pending.current.clear();
      ids.forEach((i) => seen.current.add(i));
      registerShown(ids).catch(() => {}); // métrica: falha não deve afetar a tela
    }, 600);
  }, []);
}

/** Item: avisa quando ficou pelo menos 60% visível. */
function RecItem({ item, onShown }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onShown(item.id);
          obs.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [item.id, onShown]);

  // AJUSTE: troque pelos campos reais do ContentRecommendationResponse.
  const { id, title, description, url, type } = item;

  return (
    <a
      ref={ref}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => registerClick(id).catch(() => {})}
      style={{
        display: 'block',
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      <div className="row between" style={{ gap: 8 }}>
        <b>{title}</b>
        {type && <span className="muted" style={{ fontSize: 12 }}>{type}</span>}
      </div>
      {description && (
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{description}</p>
      )}
    </a>
  );
}

export default function ContentRecommendations() {
  // nonce 0 = carga inicial (GET); depois de "Atualizar" = recalcula (POST /refresh)
  const [nonce, setNonce] = useState(0);
  const recs = useAsync(
    () => (nonce === 0 ? getRecommendations() : refreshRecommendations()),
    [nonce]
  );
  const markShown = useShownTracker(nonce);

  return (
    <Card title="Para você hoje" icon="auto_awesome">
      <Async res={recs}>{(d) => {
        const items = list(d);
        return (
          <>
            {items.length === 0 ? (
              <p className="hint">Ainda não há recomendações. Toque em Atualizar para gerar novas.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {items.map((it) => (
                  <RecItem key={it.id} item={it} onShown={markShown} />
                ))}
              </div>
            )}
            <button
              className="btn btn-ghost btn-block"
              style={{ marginTop: 14 }}
              onClick={() => setNonce((n) => n + 1)}
            >
              Atualizar recomendações
            </button>
          </>
        );
      }}</Async>
    </Card>
  );
}