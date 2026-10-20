import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRecommendations,
  refreshRecommendations,
  registerClick,
  registerShown,
} from "../services/recommendationsApi";
import "../styles/ContentRecommendations.css";

/**
 * Hook: carrega recomendações, atualiza e registra "visto" em lote.
 */
function useContentRecommendations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const seen = useRef(new Set()); // ids já enviados ao backend
  const pending = useRef(new Set()); // ids visíveis aguardando envio
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getRecommendations()
      .then((data) => !cancelled && setItems(data ?? []))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const flushShown = useCallback(() => {
    const ids = [...pending.current];
    pending.current.clear();
    if (ids.length === 0) return;
    ids.forEach((id) => seen.current.add(id));
    registerShown(ids).catch(() => {}); // métrica: falha não deve afetar a tela
  }, []);

  const markShown = useCallback(
    (id) => {
      if (seen.current.has(id) || pending.current.has(id)) return;
      pending.current.add(id);
      clearTimeout(timer.current);
      timer.current = setTimeout(flushShown, 600); // agrupa vários cards em 1 request
    },
    [flushShown]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await refreshRecommendations();
      seen.current.clear();
      setItems(data ?? []);
    } catch (e) {
      setError(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { items, loading, refreshing, error, refresh, markShown };
}

/** Card: avisa quando ficou ≥60% visível na tela. */
function RecommendationCard({ item, onShown }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onShown(item.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [item.id, onShown]);

  // AJUSTE 3: troque os campos abaixo pelos do seu ContentRecommendationResponse.
  const { id, title, description, url, type } = item;

  return (
    <li ref={ref} className="rec-card">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => registerClick(id).catch(() => {})}
      >
        <h3 className="rec-title">{title}</h3>
        {type && <span className="rec-type">{type}</span>}
        {description && <p className="rec-desc">{description}</p>}
      </a>
    </li>
  );
}

export default function ContentRecommendations() {
  const { items, loading, refreshing, error, refresh, markShown } =
    useContentRecommendations();

  return (
    <section className="rec" aria-labelledby="rec-heading">
      <header className="rec-header">
        <h2 id="rec-heading">Para você hoje</h2>
        <button onClick={refresh} disabled={refreshing || loading}>
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </header>

      {loading && <p className="rec-status">Carregando recomendações...</p>}

      {error && (
        <p className="rec-status rec-error" role="alert">
          Não foi possível carregar as recomendações. Tente atualizar.
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="rec-status">
          Ainda não há recomendações. Volte mais tarde ou toque em Atualizar.
        </p>
      )}

      <ul className="rec-list">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} onShown={markShown} />
        ))}
      </ul>
    </section>
  );
}