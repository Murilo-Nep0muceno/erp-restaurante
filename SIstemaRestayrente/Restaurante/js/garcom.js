let state = lerBanco();
let currentCat = 'Todas';

function atualizarTela() {
  state = lerBanco();
  if(!state.tables || state.tables.length === 0) {
    state.tables = Array.from({length:12},(_,i)=>({ num:i+1, status:'free', orderId:null }));
    salvarBanco(state);
  }
  if(!state.categories) state.categories = ['Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas'];
  if(!state.dishes) state.dishes = [];
  renderTables();
  renderGarcomOrders();
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

function renderTables(){
  document.getElementById('tables-grid').innerHTML = state.tables.map(t=>`
    <div class="table-cell ${t.status==='occupied'?'occupied':'free'}" onclick="handleTableClick(${t.num}, '${t.status}')">
      <div class="table-num">${String(t.num).padStart(2,'0')}</div>
      <div class="table-status">${t.status==='occupied'?'Ocupada':'Livre'}</div>
    </div>
  `).join('');
}

function addTable() {
  const proximoNum = state.tables.length > 0 ? Math.max(...state.tables.map(t=>t.num)) + 1 : 1;
  state.tables.push({ num: proximoNum, status: 'free', orderId: null });
  salvarBanco(state);
  atualizarTela();
  showNotif('success', `Mesa ${String(proximoNum).padStart(2,'0')} adicionada ao mapa.`);
}

function removeTable() {
  const t = state.tables.find(x => x.num === state.selectedTable);
  if (t.status === 'occupied') {
    showNotif('error', 'Ação negada: A mesa possui uma comanda em andamento.');
    return;
  }
  if (confirm(`Tem certeza absoluta que deseja remover a Mesa ${String(t.num).padStart(2,'0')}?`)) {
    state.tables = state.tables.filter(x => x.num !== state.selectedTable);
    salvarBanco(state);
    closeModal('tableAction');
    atualizarTela();
    showNotif('success', 'Mesa removida com sucesso.');
  }
}

function handleTableClick(num, status) {
  state.selectedTable = num;
  document.getElementById('action-table-name').textContent = `Mesa ${String(num).padStart(2,'0')}`;
  document.getElementById('action-table-status').textContent = status === 'occupied' ? 'Comanda Aberta' : 'Mesa Livre';
  document.getElementById('modal-tableAction').classList.add('open');
}

function openOrder(){
  closeModal('tableAction');
  state.cart = [];
  showPage('comanda', null, null);
  document.getElementById('comanda-title').textContent = `Mesa ${String(state.selectedTable).padStart(2,'0')}`;
  renderGarcomMenu();
  renderCart();
}

function renderGarcomMenu(){
  const abas = ['Todas', ...state.categories];
  document.getElementById('garcom-cat-tabs').innerHTML = abas.map(c=>`<div class="cat-tab ${c===currentCat?'active':''}" style="white-space:nowrap; font-size: 14px; font-weight: 600;" onclick="filterGarcomMenu('${c}')">${c}</div>`).join('');
  const filtered = currentCat==='Todas' ? state.dishes : state.dishes.filter(d=>d.category===currentCat);
  const placeholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect><circle cx='8.5' cy='8.5' r='1.5'></circle><polyline points='21 15 16 10 5 21'></polyline></svg>`;

  document.getElementById('garcom-menu-grid').innerHTML = filtered.map(d=>`
    <div class="menu-dish">
      <img src="${d.img || placeholder}" class="menu-dish-img">
      <div class="menu-dish-body">
        <div>
          <div class="menu-dish-name">${d.name}</div>
          <div class="menu-dish-desc">${d.desc || ''}</div>
        </div>
        <div class="menu-dish-price">R$ ${d.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      </div>
      <button class="add-btn" onclick="addToCart(${d.id})">
        <svg class="svg-icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
  `).join('') || '<div style="grid-column:1/-1; padding:32px; text-align:center; color:var(--gray-400); border:1px dashed var(--gray-200); border-radius:12px;">Nenhum item nesta categoria.</div>';
}

function filterGarcomMenu(cat){
  currentCat = cat;
  renderGarcomMenu();
}

function addToCart(dishId){
  const d = state.dishes.find(x=>x.id===dishId); if(!d) return;
  const existing = state.cart.find(i=>i.dishId===dishId);
  if(existing) existing.qty++;
  else state.cart.push({ dishId, name:d.name, price:d.price, qty:1, note: '' });
  renderCart();
  showNotif('success', `${d.name} adicionado à comanda!`);
}

function updateQty(dishId, delta){
  const item = state.cart.find(i=>i.dishId===dishId); if(!item) return;
  item.qty += delta;
  if(item.qty<=0) state.cart = state.cart.filter(i=>i.dishId!==dishId);
  renderCart();
}

function updateItemNote(dishId, noteVal) {
  const item = state.cart.find(i=>i.dishId===dishId);
  if(item) item.note = noteVal;
}

function renderCart(){
  const listEl = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('cart-empty-msg');
  const totalsEl = document.getElementById('cart-totals');
  const labelEl = document.getElementById('cart-table-label');
  
  const total = state.cart.reduce((a,i)=>a+i.price*i.qty,0);
  labelEl.innerHTML = `Resumo da Mesa <span style="color:var(--gold); font-size:22px;">R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>`;

  if(!state.cart.length){ emptyEl.style.display='block'; listEl.innerHTML=''; totalsEl.style.display='none'; return; }
  
  emptyEl.style.display='none'; totalsEl.style.display='block';
  
  listEl.innerHTML = state.cart.map(item=>`
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">R$ ${(item.price*item.qty).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateQty(${item.dishId},-1)"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${item.dishId},1)"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
      </div>
      <input type="text" class="item-note-input" placeholder="Observações (Ex: Sem cebola)" value="${item.note || ''}" oninput="updateItemNote(${item.dishId}, this.value)">
    </div>
  `).join('');
}

function sendToKitchen(){
  if(!state.cart.length){ showNotif('warning','A comanda está vazia.'); return; }
  const total = state.cart.reduce((a,i)=>a+i.price*i.qty,0);
  const time = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const orderId = 'ORD-'+String(Date.now()).slice(-4);
  const order = {
    id: orderId, table: `Mesa ${String(state.selectedTable).padStart(2,'0')}`, tableNum: state.selectedTable,
    dishes: state.cart.map(i=>({dishId:i.dishId, name:i.name, price:i.price, qty:i.qty, note:i.note})),
    status: 'novo', total, time, note: document.getElementById('order-note-txt').value.trim()
  };
  state.orders.push(order);
  const t = state.tables.find(x=>x.num===state.selectedTable);
  if(t){ t.status='occupied'; t.orderId=orderId; }
  state.cart = []; state.selectedTable = null; document.getElementById('order-note-txt').value = '';
  salvarBanco(state); showPage('mesas', null, 0); atualizarTela(); showNotif('success','Pedido enviado para a cozinha!');
}

function renderGarcomOrders(){
  const myOrders = state.orders.filter(o=>o.status!=='rejeitado').reverse();
  const statusUI = { 
    'novo': { label: 'NOVO', color: '#3b82f6', bg: '#eff6ff' },
    'preparando': { label: 'PREPARANDO', color: '#f59e0b', bg: '#fef3c7' },
    'pronto': { label: 'PRONTO P/ RETIRAR', color: '#fff', bg: '#004AAD' },
    'entregue': { label: 'ENTREGUE', color: '#6b7280', bg: '#f3f4f6' }
  };
  
  document.getElementById('garcom-orders-list').innerHTML = myOrders.length ? myOrders.map(o=>{
    const ui = statusUI[o.status] || { label: o.status, color: '#6b7280', bg: '#f3f4f6' };
    const itemsHtml = o.dishes.map(d=>`
      <div class="order-item-row">
        <strong>${d.qty}x</strong> ${d.name}
        ${d.note ? `<div class="order-item-note">↳ Obs: ${d.note}</div>` : ''}
      </div>
    `).join('');
    return `
    <div class="card order-card">
      <div style="display:flex;justify-content:space-between; align-items:flex-start;">
        <div style="flex:1; padding-right:16px;">
          <div class="order-card-title">${o.table} — #${o.id}</div>
          <div class="order-card-time">⌚ ${o.time}</div>
          <div class="order-items-box">${itemsHtml}</div>
          ${o.note ? `<div class="order-general-note"><strong>Geral:</strong> ${o.note}</div>` : ''}
        </div>
        <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end;">
          <span style="font-size: 11px; font-weight: 800; background: ${ui.bg}; color: ${ui.color}; padding: 4px 8px; border-radius: 12px;">${ui.label}</span>
          <div class="order-card-total">R$ ${o.total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
        </div>
      </div>
    </div>
  `}).join('') : `
    <div style="text-align:center; padding:60px 20px; color:var(--gray-400); border:2px dashed var(--gray-200); border-radius:16px;">
      <svg class="svg-icon" style="width:48px;height:48px; margin-bottom:12px; opacity:0.3;" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
      <br><strong>Nenhum pedido ativo</strong><br><span style="font-size:12px;">Suas comandas enviadas aparecerão aqui.</span>
    </div>`;
}

window.onload = () => { checkHighContrast(); atualizarTela(); };