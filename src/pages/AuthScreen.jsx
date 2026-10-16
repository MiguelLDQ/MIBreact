import { useState } from 'react';
import { Icon } from '../components/ui';
import { useApp } from '../context/AppContext';

export default function AuthScreen() {
  const { login, register, toast } = useApp();
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setBusy(true);
    try {
      if (isLogin) await login(fd.get('identifier').trim(), fd.get('password'));
      else if (!(await register(fd.get('name').trim(), fd.get('email').trim(), fd.get('password')))) setMode('login');
    } catch (err) {
      toast(err.message || (isLogin ? 'Não foi possível entrar.' : 'Não foi possível criar a conta.'), 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <Icon name="psychology" /><h1>MIB</h1>
          <span className="tag">evolução do BMO · saúde mental &amp; comunidade</span>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: 18, fontSize: 18 }}>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
        <form onSubmit={submit} key={mode}>
          {isLogin ? (
            <>
              <div className="field"><label>Email ou usuário</label><input type="text" name="identifier" required autoComplete="username" /></div>
              <div className="field"><label>Senha</label><input type="password" name="password" required autoComplete="current-password" /></div>
            </>
          ) : (
            <>
              <div className="field"><label>Nome / apelido</label><input type="text" name="name" required autoComplete="name" /></div>
              <div className="field"><label>Email</label><input type="email" name="email" required autoComplete="email" /></div>
              <div className="field">
                <label>Senha</label>
                <input type="password" name="password" required minLength={8} autoComplete="new-password" />
                <div className="hint">Mínimo 8 caracteres, com letras e números.</div>
              </div>
            </>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? (isLogin ? 'Entrando...' : 'Cadastrando...') : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
        <div className="auth-toggle">
          {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
          <button className="link-btn" onClick={() => setMode(isLogin ? 'register' : 'login')}>{isLogin ? 'Cadastre-se' : 'Faça login'}</button>
        </div>
      </div>
    </div>
  );
}
