import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNotif } from '../../store/notifContext';
import { exportBackup, resetData, restoreBackup } from '../../services/backup.service';
import { recordLog } from '../../services/log.service';
import { getApiErrorMessage } from '../../services/api';
import { downloadJSON } from '../../lib/csv';
import { IconDownload, IconUpload } from '../../components/icons';

export default function BackupSection() {
  const { notify } = useNotif();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const data = await exportBackup();
      downloadJSON(`epicurean-backup-${new Date().toISOString().slice(0, 10)}.json`, data);
      recordLog('Fez download do Backup do Sistema');
      notify('Backup exportado.');
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
    } finally {
      setBusy(false);
    }
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (
      !window.confirm(
        'Restaurar um backup substitui TODOS os dados atuais do sistema. Deseja continuar?',
      )
    )
      return;
    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      try {
        const data = JSON.parse(String(reader.result));
        await restoreBackup(data);
        recordLog('Restaurou o sistema a partir de um backup');
        notify('Backup restaurado. Recarregando…');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        notify(getApiErrorMessage(err, 'Arquivo de backup inválido.'), '⚠');
        setBusy(false);
      }
    };
    reader.readAsText(file);
  }

  async function handleReset() {
    if (
      !window.confirm(
        'Isto vai apagar compras, movimentações de estoque e o histórico de logs. Cardápio, estoque, fornecedores, usuários e configurações são mantidos. Continuar?',
      )
    )
      return;
    setBusy(true);
    try {
      await resetData();
      recordLog('Zerou os dados do mês (compras, movimentos e logs)');
      notify('Dados do mês zerados. Recarregando…');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      notify(getApiErrorMessage(err), '⚠');
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div style={{ color: 'var(--gold)', marginBottom: 12 }}>
            <IconDownload width={32} height={32} />
          </div>
          <h2 className="card-title" style={{ marginBottom: 6 }}>
            Fazer Backup
          </h2>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.5 }}>
            Baixe todo o cardápio, estoque, compras, usuários e logs em um arquivo seguro.
          </p>
          <button type="button" className="btn btn-outline btn-block" onClick={handleExport} disabled={busy}>
            Exportar Sistema
          </button>
        </div>

        <div className="card">
          <div style={{ color: 'var(--blue)', marginBottom: 12 }}>
            <IconUpload width={32} height={32} />
          </div>
          <h2 className="card-title" style={{ marginBottom: 6 }}>
            Restaurar Dados
          </h2>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.5 }}>
            Suba um arquivo de backup anterior para restaurar seu restaurante.
          </p>
          <button type="button" className="btn btn-blue btn-block" onClick={handleImportClick} disabled={busy}>
            Importar Arquivo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>
      </div>

      <div className="card" style={{ border: '1.5px dashed var(--red)', background: 'var(--red-light)' }}>
        <h2 className="card-title" style={{ color: 'var(--red)', marginBottom: 6 }}>
          Zona de Perigo (Virar o Mês)
        </h2>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.5 }}>
          Esta ação apagará todas as compras, movimentações de estoque e o histórico de logs para
          limpar o sistema. Cardápio, estoque, fornecedores, usuários e configurações serão mantidos.
        </p>
        <button type="button" className="btn btn-red" onClick={handleReset} disabled={busy}>
          Zerar Dados do Mês
        </button>
      </div>
    </div>
  );
}
