let state = lerBanco();

function atualizarTela() {
  state = lerBanco();
  if(!state.orders) state.orders = [];
  if(!state.estoque) state.estoque = [];
  renderKanban();
  renderEstoque();
}

function showPage(pageId, navEl, navIndex) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
  if(navEl && navEl.classList) navEl.classList.add('active');
  else if(navIndex !== null && document.querySelectorAll('.sidebar .nav-item')[navIndex]) document.querySelectorAll('.sidebar .nav-item')[navIndex].classList.add('active');
  document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
  if(navIndex !== null && document.querySelectorAll('.bottom-nav-item')[navIndex]) document.querySelectorAll('.bottom-nav-item')[navIndex].classList.add('active');
}

function renderKanban(){
  const newOrders = state.orders.filter(o=>o.status==='novo');
  const cooking = state.orders.filter(o=>o.status==='preparando');
  const ready = state.orders.filter(o=>o.status==='pronto');

  document.getElementById('kitchen-kanban').innerHTML = `
    <div class="kanban-col"><div class="kanban-col-header"><div class="kanban-col-title"><svg class="svg-icon" style="color:var(--blue);" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg> Pedidos Novos</div><span class="kanban-count">${String(newOrders.length).padStart(2,'0')}</span></div>${newOrders.length ? newOrders.map(o=>kanbanCardHTML(o,'new')).join('') : kanbanEmpty('Nenhum pedido na fila')}</div>
    <div class="kanban-col"><div class="kanban-col-header"><div class="kanban-col-title"><svg class="svg-icon" style="color:var(--gold);" viewBox="0 0 24 24"><path d="M12 2c0 3-3 5-3 8 0 3 3 4 3 8 0-3 3-5 3-8 0-3-3-4-3-8z"></path></svg> No Fogão</div><span class="kanban-count">${String(cooking.length).padStart(2,'0')}</span></div>${cooking.length ? cooking.map(o=>kanbanCardHTML(o,'cooking')).join('') : kanbanEmpty('Nenhum prato em preparo')}</div>
    <div class="kanban-col"><div class="kanban-col-header"><div class="kanban-col-title"><svg class="svg-icon" style="color:var(--green);" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Pronto (Retirada)</div><span class="kanban-count">${String(ready.length).padStart(2,'0')}</span></div>${ready.length ? ready.map(o=>kanbanCardHTML(o,'ready')).join('') : kanbanEmpty('Nenhum prato aguardando')}</div>
  `;
}

function kanbanCardHTML(o, type){
  const btns = {
    'new': `<div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-outline" style="border-color:var(--red);color:var(--red);flex:1;" onclick="changeOrderStatus('${o.id}','rejeitado')"><svg class="svg-icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Recusar</button><button class="btn btn-primary" style="flex:2; background:var(--blue); border-color:var(--blue);" onclick="changeOrderStatus('${o.id}','preparando')"><svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Iniciar</button></div>`,
    'cooking': `<button class="btn btn-primary btn-block" style="margin-top:16px; background:var(--gold); border-color:var(--gold); color:var(--dark); font-weight: 800;" onclick="changeOrderStatus('${o.id}','pronto')"><svg class="svg-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> Finalizar Prato</button>`,
    'ready': `<button class="btn btn-primary btn-block" style="margin-top:16px; background:var(--green); border-color:var(--green); font-weight: 800;" onclick="changeOrderStatus('${o.id}','entregue')"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Confirmar Retirada</button>`
  };
  const dishesHtml = o.dishes.map(d=>`<li><span style="font-weight:800; color:var(--dark); font-size: 15px;">${d.qty}x</span> <span style="font-size: 14px;">${d.name}</span>${d.note ? `<div style="font-size:12px; color:var(--red); font-weight:700; margin-left:16px; margin-top:4px;">↳ OBS: ${d.note}</div>` : ''}</li>`).join('');
  return `<div class="kanban-card ${type}"><div class="kanban-card-table"><span style="font-size: 13px;">${o.table}</span><span style="color:var(--gray-400); font-weight:600; font-size: 12px;">⌚ ${o.time}</span></div><div class="kanban-card-name">Pedido #${o.id.split('-')[1]}</div><ul class="kanban-card-items">${dishesHtml}</ul>${o.note ? `<div class="kanban-card-note"><strong style="font-size: 12px;">NOTA GERAL:</strong> <span style="font-size: 13px;">${o.note}</span></div>` : ''}${btns[type]||''}</div>`;
}

function kanbanEmpty(msg){
  return `<div class="kanban-empty"><svg class="svg-icon" style="width:36px;height:36px; opacity:0.3; margin-bottom:12px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><br><span style="font-size: 14px; font-weight: 500;">${msg}</span></div>`;
}

function changeOrderStatus(orderId, newStatus){
  const o = state.orders.find(x=>x.id===orderId);
  if(o) o.status = newStatus;
  if(newStatus==='entregue' || newStatus==='rejeitado'){ const t = state.tables.find(x=>x.orderId===orderId); if(t){ t.status='free'; t.orderId=null; } }
  salvarBanco(state); renderKanban();
  if(newStatus==='rejeitado') showNotif('error', 'Pedido recusado.'); else if(newStatus==='preparando') showNotif('warning', 'Preparo iniciado.'); else showNotif('success', 'Status do pedido atualizado.');
}

function renderEstoque() {
  const itensTotal = state.estoque.length;
  const valorTotal = state.estoque.reduce((acc, item) => acc + (item.qty * item.price), 0);
  document.getElementById('estoque-metrics').innerHTML = `<div class="dash-card"><div class="dash-card-title">TOTAL DE ITENS CADASTRADOS</div><div class="dash-card-value">${itensTotal}</div></div><div class="dash-card" style="border-bottom: 4px solid var(--gold);"><div class="dash-card-title">VALOR TOTAL EM ESTOQUE</div><div class="dash-card-value">R$ ${valorTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>`;
  document.getElementById('estoque-body').innerHTML = state.estoque.map(item => `<tr><td style="font-weight:700; color:var(--dark); font-size: 15px;">${item.name}</td><td style="color:var(--gray-600); font-size: 14px;">${item.supplier || '-'}</td><td><span style="font-weight:800; font-size:16px;">${item.qty}</span><span style="font-size:12px; font-weight:700; color:var(--gray-600); background:var(--gray-200); padding:4px 8px; border-radius:6px; margin-left:6px;">${item.unit || 'UN'}</span></td><td style="font-size: 15px; font-weight: 500;">R$ ${item.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td style="font-weight:800; color:var(--gold); font-size: 16px;">R$ ${(item.qty * item.price).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td><div style="display:flex; gap:8px;"><button class="btn btn-outline btn-sm" style="padding:6px 10px; border-color:var(--blue); color:var(--blue);" onclick="editStock(${item.id})"><svg class="svg-icon" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button><button class="btn btn-outline btn-sm" style="padding:6px 10px; border-color:var(--red); color:var(--red);" onclick="deleteStock(${item.id})"><svg class="svg-icon" style="width:16px;height:16px;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--gray-400); font-size: 15px;">Nenhum item cadastrado no estoque.</td></tr>';
}

function openStockModal() {
  document.getElementById('modal-stock-title').textContent = "Novo Ingrediente";
  ['stock-id', 'stock-name', 'stock-supplier', 'stock-qty', 'stock-price'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('stock-unit').value = 'UN';
  document.getElementById('modal-stock').classList.add('open');
}

function saveStock() {
  const id = document.getElementById('stock-id').value;
  const name = document.getElementById('stock-name').value.trim();
  const supplier = document.getElementById('stock-supplier').value.trim();
  const qty = parseFloat(document.getElementById('stock-qty').value);
  const unit = document.getElementById('stock-unit').value;
  const price = parseFloat(document.getElementById('stock-price').value);
  if (!name || isNaN(qty) || isNaN(price)) { showNotif('warning', 'Preencha Nome, Quantidade e Preço.'); return; }
  if (id) {
    const index = state.estoque.findIndex(x => x.id == id);
    if(index > -1) state.estoque[index] = { ...state.estoque[index], name, supplier, qty, unit, price };
  } else state.estoque.push({ id: Date.now(), name, supplier, qty, unit, price });
  salvarBanco(state); closeModal('stock'); atualizarTela(); showNotif('success', 'Produto salvo no estoque!');
}

function editStock(id) {
  const item = state.estoque.find(x => x.id == id);
  if(!item) return;
  document.getElementById('modal-stock-title').textContent = "Editar Ingrediente";
  document.getElementById('stock-id').value = item.id;
  document.getElementById('stock-name').value = item.name;
  document.getElementById('stock-supplier').value = item.supplier;
  document.getElementById('stock-qty').value = item.qty;
  document.getElementById('stock-unit').value = item.unit || 'UN';
  document.getElementById('stock-price').value = item.price;
  document.getElementById('modal-stock').classList.add('open');
}

function deleteStock(id) {
  if(confirm('Remover este item do estoque?')) { state.estoque = state.estoque.filter(x => x.id != id); salvarBanco(state); atualizarTela(); showNotif('success', 'Item removido.'); }
}

window.onload = () => {
  checkHighContrast(); atualizarTela();
  setInterval(() => { document.getElementById('kitchen-time').textContent = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit', second:'2-digit'}); }, 1000);
};