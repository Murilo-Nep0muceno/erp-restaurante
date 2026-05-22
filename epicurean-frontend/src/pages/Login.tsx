import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { landingForRole } from '../config/roles';
import { getApiErrorMessage } from '../services/api';
import styles from './Login.module.css';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [passWord, setPassWord] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await signIn(userName.trim(), passWord);
      // Cada papel tem um painel próprio — sempre vai pelo papel.
      navigate(landingForRole(user.role), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Usuário ou senha incorretos!'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.banner}>
        <svg
          className={styles.bannerIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
          <line x1="6" y1="17" x2="18" y2="17" />
        </svg>
        <h1>The Epicurean</h1>
        <p>Gestão Inteligente</p>
      </div>

      <div className={styles.formArea}>
        <div className={styles.box}>
          <div className={styles.header}>
            <h2>Bem-vindo de volta</h2>
            <p>Insira suas credenciais para acessar o painel</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="Digite seu usuário"
                autoComplete="username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
                value={passWord}
                onChange={(e) => setPassWord(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
