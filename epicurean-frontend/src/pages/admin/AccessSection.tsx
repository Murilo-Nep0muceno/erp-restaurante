import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../store/authContext';
import { useNotif } from '../../store/notifContext';
import { createUser, deleteUser, getUsers, updateUser } from '../../services/user.service';
import { recordLog } from '../../services/log.service';
import { getApiErrorMessage } from '../../services/api';
import { ROLE_LABEL } from '../../config/roles';
import type { Role, UserAccount } from '../../types';
import Modal from '../../components/Modal';
import AsyncState from '../../components/AsyncState';
import { IconEdit, IconTrash } from '../../components/icons';

const ROLES: Role[] = ['GERENTE', 'BALCONISTA', 'GARCOM', 'COZINHA'];

const ROLE_BADGE: Record<Role, string> = {
  GERENTE: 'badge-gold',
  BALCONISTA: 'badge-orange',
  GARCOM: 'badge-blue',
  COZINHA: 'badge-green',
};

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (v: string) => /[a-z]/.test(v), label: 'Letra minúscula' },
  { test: (v: string) => /[A-Z]/.test(v), label: 'Letra maiúscula' },
  { test: (v: string) => /\d/.test(v), label: 'Número' },
  { test: (v: string) => /[@$!%*?&]/.test(v), label: 'Caractere especial (@$!%*?&)' },
];

const editBtn: CSSProperties = {
  background: 'var(--blue-light)',
  color: 'var(--blue)',
  border: '1.5px solid var(--blue)',
};
const trashBtn: CSSProperties = {
  background: 'var(--red-light)',
  color: 'var(--red)',
  border: '1.5px solid var(--red)',
};

interface AccessSectionProps {
  newUserOpen: boolean;
  onCloseNewUser: () => void;
}

export default function AccessSection({ newUserOpen, onCloseNewUser }: AccessSectionProps) {
  const { data, loading, error, reload } = useFetch(getUsers);
  const { user: currentUser } = useAuth();
  const { notify } = useNotif();

  // create form
  const [role, setRole] = useState<Role>('BALCONISTA');
  const [name, setName] = useState('');
  const [userName, setUserName] = useState('');
  const [passWord, setPassWord] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // edit form
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('BALCONISTA');
  const [editSaving, setEditSaving] = useState(false);

  // delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<UserAccount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const accounts = data ?? [];
  const total = accounts.length;
  const managers = accounts.filter((a) => a.role === 'GERENTE').length;
  const waiters = accounts.filter((a) => a.role === 'GARCOM').length;

  const passwordValid = PASSWORD_RULES.every((r) => r.test(passWord));
  const createValid = passwordValid && userName.trim().length > 0;

  function closeCreate() {
    setName('');
    setUserName('');
    setPassWord('');
    setFormError('');
    onCloseNewUser();
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await createUser(role, { userName: userName.trim(), passWord, name: name.trim() || undefined });
      recordLog(`Criou usuário "${userName.trim()}" (${ROLE_LABEL[role]})`);
      notify(`${ROLE_LABEL[role]} "${userName.trim()}" criado.`);
      closeCreate();
      await reload();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(account: UserAccount) {
    setEditing(account);
    setEditName(account.name ?? '');
    setEditRole(account.role);
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditSaving(true);
    try {
      await updateUser(editing.id, { name: editName.trim(), role: editRole });
      recordLog(`Editou a conta "${editing.userName}"`);
      notify('Conta atualizada.');
      setEditing(null);
      await reload();
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
    } finally {
      setEditSaving(false);
    }
  }

  async function doDelete(account: UserAccount) {
    if (account.id === currentUser?.id) {
      notify('Você não pode excluir a própria conta.', '⚠');
      setConfirmDelete(null);
      return;
    }
    setDeletingId(account.id);
    try {
      await deleteUser(account.id);
      recordLog(`Excluiu a conta "${account.userName}"`);
      notify('Conta excluída.');
      setConfirmDelete(null);
      await reload();
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="stats-grid">
        <div
          className="stat-card"
          style={{ borderLeft: 'none', borderBottom: '3px solid var(--brown-light)' }}
        >
          <div className="stat-label">Total de Contas</div>
          <div className="stat-value">{total}</div>
        </div>
        <div
          className="stat-card"
          style={{ borderLeft: 'none', borderBottom: '3px solid var(--gold)' }}
        >
          <div className="stat-label">Admins / Gerência</div>
          <div className="stat-value">{managers}</div>
        </div>
        <div
          className="stat-card"
          style={{ borderLeft: 'none', borderBottom: '3px solid var(--blue)' }}
        >
          <div className="stat-label">Garçons Ativos</div>
          <div className="stat-value">{waiters}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Contas Cadastradas</h2>
        </div>

        <AsyncState loading={loading} error={error} empty={accounts.length === 0} onRetry={reload} />

        {!loading && !error && accounts.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome / Descrição</th>
                <th>Login</th>
                <th>Perfil</th>
                <th>Senha</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.name || a.userName}</td>
                  <td>{a.userName}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[a.role]}`}>{ROLE_LABEL[a.role]}</span>
                  </td>
                  <td style={{ letterSpacing: 2, color: 'var(--gray-400)' }}>••••••••</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={editBtn}
                      onClick={() => openEdit(a)}
                      aria-label="Editar"
                    >
                      <IconEdit />
                    </button>{' '}
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={trashBtn}
                      onClick={() => setConfirmDelete(a)}
                      disabled={a.id === currentUser?.id}
                      title={
                        a.id === currentUser?.id
                          ? 'Você não pode excluir a própria conta'
                          : 'Excluir'
                      }
                      aria-label="Excluir"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Novo usuário */}
      <Modal open={newUserOpen} title="Novo Usuário" onClose={closeCreate}>
        <form onSubmit={handleCreate}>
          {formError && (
            <div className="badge badge-red" style={{ display: 'block', padding: 10, marginBottom: 16 }}>
              {formError}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Nome / Descrição</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Login</label>
              <input
                className="form-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Perfil</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={passWord}
              onChange={(e) => setPassWord(e.target.value)}
              required
            />
            <ul style={{ listStyle: 'none', marginTop: 10, display: 'grid', gap: 4 }}>
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(passWord);
                return (
                  <li key={r.label} style={{ fontSize: 'var(--fs-sm)', color: ok ? 'var(--green)' : 'var(--gray-400)' }}>
                    {ok ? '✓' : '○'} {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={closeCreate}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !createValid}>
              {saving ? 'Criando…' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Editar conta */}
      <Modal open={!!editing} title="Editar conta" onClose={() => setEditing(null)}>
        <form onSubmit={handleEditSave}>
          <div className="form-group">
            <label className="form-label">Login</label>
            <input className="form-input" value={editing?.userName ?? ''} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Nome / Descrição</label>
            <input
              className="form-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Perfil</label>
            <select
              className="form-select"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>
              {editSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Excluir conta */}
      {confirmDelete && (
        <Modal
          open
          title="Excluir conta"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-red"
                onClick={() => void doDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
              >
                {deletingId === confirmDelete.id ? 'Excluindo…' : 'Excluir'}
              </button>
            </>
          }
        >
          <div className="confirm-body">
            <span className="confirm-icon">
              <IconTrash width={22} height={22} />
            </span>
            <div className="confirm-text">
              <p>
                Deseja excluir a conta <strong>{confirmDelete.userName}</strong>?
              </p>
              <p className="confirm-hint">Esta ação não pode ser desfeita.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
