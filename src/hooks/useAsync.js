import { useState, useEffect } from 'react';

export function useAsync(fetcher, deps = []) {
  const [s, setS] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setS((p) => ({ ...p, loading: true, error: null }));
    fetcher()
      .then((d) => alive && setS({ data: d, loading: false, error: null }))
      .catch((e) => alive && setS({ data: null, loading: false, error: e }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...s, reload: () => setTick((t) => t + 1) };
}

export function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
