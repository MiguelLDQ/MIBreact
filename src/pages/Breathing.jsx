import { useState, useEffect, useRef, useMemo } from 'react';
import { Async, Card, Empty, Icon, ViewHeader } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { list } from '../utils/format';

const breathCompletedOnce = {};

function BreathingSession({ t, onBack }) {
  const { toast, fetchMe } = useApp();
  const inhale = t.inhaleSeconds || 4, hold1 = t.holdAfterInhaleSeconds || 0;
  const exhale = t.exhaleSeconds || 4, hold2 = t.holdAfterExhaleSeconds || 0;
  const BASE = 1, PEAK = 1.4;
  const phases = useMemo(() => {
    const p = [{ n: 'Inspire', s: inhale, scale: PEAK }];
    if (hold1 > 0) p.push({ n: 'Segure', s: hold1, scale: PEAK });
    p.push({ n: 'Expire', s: exhale, scale: BASE });
    if (hold2 > 0) p.push({ n: 'Segure', s: hold2, scale: BASE });
    return p;
  }, [inhale, hold1, exhale, hold2]);

  const [running, setRunning] = useState(false);
  const [ui, setUi] = useState({ name: 'Pronto', secs: inhale });
  const [circle, setCircle] = useState({ dur: 0, transform: 'scale(1)' });
  const circleRef = useRef(null);
  const s = useRef({ p: 0, left: phases[0].s, elapsed: 0, timer: null });
  useEffect(() => () => clearInterval(s.current.timer), []);

  const complete = async (seconds) => {
    if (breathCompletedOnce[t.id]) return;
    breathCompletedOnce[t.id] = true;
    try {
      await api(`/breathing/techniques/${t.id}/complete`, { method: 'POST', body: { durationSeconds: seconds || (t.inhaleSeconds + t.exhaleSeconds) || 30 } });
      toast('Sessão registrada! +XP', 'success'); fetchMe();
    } catch (e) { toast(e.message || 'Não foi possível registrar a sessão.', 'error'); }
  };

  const applyPhase = (idx, dur) => {
    const p = phases[idx];
    setUi({ name: p.n, secs: dur ?? p.s });
    setCircle({ dur: dur ?? p.s, transform: `scale(${p.scale})` });
  };

  const toggle = () => {
    const st = s.current;
    if (running) {
      clearInterval(st.timer); setRunning(false);
      const frozen = getComputedStyle(circleRef.current).transform;
      setCircle({ dur: 0, transform: frozen });
      return;
    }
    setRunning(true);
    applyPhase(st.p, st.left); // retoma com o tempo restante da fase
    st.timer = setInterval(() => {
      st.left--; st.elapsed++;
      if (st.left <= 0) {
        st.p = (st.p + 1) % phases.length; st.left = phases[st.p].s; applyPhase(st.p);
        if (st.p === 0) complete(st.elapsed);
      } else setUi((u) => ({ ...u, secs: st.left }));
    }, 1000);
  };

  return (
    <div className="breathe-full">
      <div className="breathe-full-top">
        <button className="btn btn-ghost btn-sm" onClick={() => { clearInterval(s.current.timer); onBack(); }}>
          <Icon name="arrow_back" />Voltar às técnicas
        </button>
      </div>
      <h3 style={{ textAlign: 'center' }}>{t.name}</h3>
      <div className="breathe-circle-lg" ref={circleRef} style={{ transitionDuration: circle.dur + 's', transform: circle.transform }}>
        <span className="phase">{ui.name}</span><span className="secs">{ui.secs}</span>
      </div>
      <button className="btn btn-primary" style={{ minWidth: 170 }} onClick={toggle}>
        {running ? 'Pausar' : s.current.elapsed > 0 ? 'Continuar' : 'Começar'}
      </button>
    </div>
  );
}

export default function Breathing() {
  const [tech, setTech] = useState(null);
  const techs = useAsync(() => api('/breathing/techniques'), []);
  const stats = useAsync(() => api('/breathing/stats').catch(() => null), []);
  if (tech) return <BreathingSession t={tech} onBack={() => setTech(null)} />;
  return (
    <>
      <ViewHeader icon="air" title="Respiração Guiada">Escolha uma técnica para começar uma sessão em tela cheia.</ViewHeader>
      <Card title="Técnicas" icon="self_improvement">
        <Async res={techs}>{(d) => list(d).length ? list(d).map((t) => (
          <div key={t.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => setTech(t)}>
            <Icon name="air" style={{ color: 'var(--mint-700)' }} />
            <div className="meta">
              <div className="title">{t.name}</div>
              <div className="sub">{t.description || `${t.inhaleSeconds}s inspirar · ${t.holdAfterInhaleSeconds}s segurar · ${t.exhaleSeconds}s expirar`}</div>
            </div>
            <Icon name="chevron_right" />
          </div>
        )) : <Empty>Nenhuma técnica encontrada.</Empty>}</Async>
      </Card>
      <Card title="Estatísticas" icon="bar_chart" style={{ marginTop: 16 }}>
        <Async res={stats}>{(s) => !s ? <div className="muted">Sem dados ainda.</div> : (
          <div className="stat-trio">
            <div><div className="num" style={{ fontSize: 18 }}>{s.totalSessions ?? s.sessions ?? 0}</div><div className="lbl">Sessões</div></div>
            <div><div className="num" style={{ fontSize: 18 }}>{s.totalMinutes ?? s.minutes ?? 0}</div><div className="lbl">Minutos</div></div>
            <div><div className="num" style={{ fontSize: 18 }}>{s.favoriteTechnique ? '★' : s.byTechnique ? Object.keys(s.byTechnique).length : 0}</div><div className="lbl">Técnicas usadas</div></div>
          </div>
        )}</Async>
      </Card>
    </>
  );
}
