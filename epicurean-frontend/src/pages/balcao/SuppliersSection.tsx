import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useNotif } from '../../store/notifContext';
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from '../../services/supplier.service';
import { getPurchases } from '../../services/purchase.service';
import { getApiErrorMessage } from '../../services/api';
import type { CreateSupplierInput, Supplier } from '../../types';
import Modal from '../../components/Modal';
import AsyncState from '../../components/AsyncState';
import { IconEdit, IconPlus, IconTrash } from '../../components/icons';
import { formatBRL, maskCNPJ, maskPhone } from '../../lib/format';

interface SupplierForm {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
}

const emptyForm: SupplierForm = { name: '', cnpj: '', phone: '', email: '' };

export default function SuppliersSection() {
  const { data, loading, error, reload } = useFetch(getSuppliers);
  const purchasesQuery = useFetch(getPurchases);
  const { notify } = useNotif();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const suppliers = data ?? [];

  // Derive per-supplier purchase stats from the purchase history (source of
  // truth), instead of storing a counter that could drift out of sync.
  const statsBySupplier = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const p of purchasesQuery.data ?? []) {
      const prev = map.get(p.id_supplier) ?? { count: 0, total: 0 };
      map.set(p.id_supplier, {
        count: prev.count + 1,
        total: prev.total + (p.total_price ?? 0),
      });
    }
    return map;
  }, [purchasesQuery.data]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      cnpj: s.cnpj,
      phone: s.phone ?? '',
      email: s.email ?? '',
    });
    setFormError('');
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload: CreateSupplierInput = {
      name: form.name,
      cnpj: form.cnpj.replace(/\D/g, ''),
    };
    // Omit empty optional fields so the backend's @IsEmail doesn't reject ''.
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (phone) payload.phone = phone;
    if (email) payload.email = email;
    try {
      if (editing) {
        await updateSupplier(editing.id_supplier, payload);
        notify('Fornecedor atualizado.');
      } else {
        await createSupplier(payload);
        notify('Fornecedor criado.');
      }
      setOpen(false);
      await reload();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Supplier) {
    if (!window.confirm(`Excluir o fornecedor "${s.name}"?`)) return;
    try {
      await deleteSupplier(s.id_supplier);
      notify('Fornecedor excluído.');
      await reload();
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Fornecedores</h2>
        <button type="button" className="btn btn-gold" onClick={openCreate}>
          <IconPlus /> Novo fornecedor
        </button>
      </div>

      <AsyncState
        loading={loading}
        error={error}
        empty={suppliers.length === 0}
        emptyText="Cadastre seu primeiro fornecedor."
        onRetry={reload}
      />

      {!loading && !error && suppliers.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Fornecedor</th>
              <th>CNPJ</th>
              <th>Contato</th>
              <th style={{ textAlign: 'right' }}>Compras</th>
              <th style={{ textAlign: 'right' }}>Total gasto</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => {
              const stats = statsBySupplier.get(s.id_supplier) ?? { count: 0, total: 0 };
              return (
                <tr key={s.id_supplier}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{maskCNPJ(s.cnpj)}</td>
                  <td>
                    {s.phone || s.email ? (
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--fs-base)' }}>
                        {s.phone && <span>{maskPhone(s.phone)}</span>}
                        {s.email && <span style={{ color: 'var(--gray-400)' }}>{s.email}</span>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--gray-400)' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>{stats.count}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatBRL(stats.total)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                      <IconEdit />
                    </button>{' '}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(s)}>
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Modal
        open={open}
        title={editing ? 'Editar fornecedor' : 'Novo fornecedor'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="badge badge-red" style={{ display: 'block', padding: 10, marginBottom: 16 }}>
              {formError}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Razão social / Nome</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">CNPJ</label>
            <input
              className="form-input"
              value={maskCNPJ(form.cnpj)}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>
          <div className="form-row cols-2">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                className="form-input"
                value={maskPhone(form.phone)}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@fornecedor.com"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
