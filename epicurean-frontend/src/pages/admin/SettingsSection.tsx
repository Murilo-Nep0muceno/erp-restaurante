import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNotif } from '../../store/notifContext';
import { useFetch } from '../../hooks/useFetch';
import { getSettings, updateSettings } from '../../services/settings.service';
import { recordLog } from '../../services/log.service';
import { getApiErrorMessage } from '../../services/api';
import type { AppSettings } from '../../types';
import AsyncState from '../../components/AsyncState';
import { maskCNPJ } from '../../lib/format';

export default function SettingsSection() {
  const { data, loading, error, reload } = useFetch(getSettings);

  if (loading || error || !data) {
    return (
      <div className="card" style={{ maxWidth: 720 }}>
        <AsyncState loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }: { initial: AppSettings }) {
  const { notify } = useNotif();
  const [form, setForm] = useState<AppSettings>(initial);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        restaurantName: form.restaurantName,
        tableCount: Number(form.tableCount),
        cnpj: form.cnpj.replace(/\D/g, ''),
        phone: form.phone,
        footerNotice: form.footerNotice,
      });
      recordLog(`Alterou configurações gerais (Mesas: ${form.tableCount})`);
      notify('Configurações salvas.');
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div className="card-header">
        <h2 className="card-title">Dados do Estabelecimento e Operação</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Nome de exibição do restaurante</label>
            <input
              className="form-input"
              value={form.restaurantName}
              onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Qtd. de mesas no salão</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={form.tableCount}
              onChange={(e) => setForm({ ...form, tableCount: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">CNPJ (para recibos)</label>
            <input
              className="form-input"
              placeholder="00.000.000/0001-00"
              value={maskCNPJ(form.cnpj)}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp / Telefone</label>
            <input
              className="form-input"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Aviso de rodapé (aparece no cardápio digital do cliente)</label>
          <input
            className="form-input"
            placeholder="Ex: Wi-Fi: restaurante123 | Não cobramos 10%"
            value={form.footerNotice}
            onChange={(e) => setForm({ ...form, footerNotice: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 8 }} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar Configurações Globais'}
        </button>
      </form>
    </div>
  );
}
