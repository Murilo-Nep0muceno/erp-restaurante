let state = lerBanco();
let currentCatFilter = 'Todas';
let base64ImageTemp = null;

function atualizarTela() {
  state = lerBanco();
  if (!state.categories || state.categories.length === 0) { state.categories = ['Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas']; salvarBanco(state); }
  if (!state.costs) state.costs = [];
  if (!state.dishes) state.dishes = [];
  if (!state.orders) state.orders = [];
  renderDashboard(); renderCardapio(); renderCustos();
}

function showPage(page, el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
}

function renderDashboard() {
  const pedidosFinalizados = state.orders.filter(o => o.status === 'entregue');
  const totalVendas = pedidosFinalizados.reduce((acc, o) => acc + o.total, 0);
  const qtdPedidos = pedidosFinalizados.length;
  const ticketMedio = qtdPedidos > 0 ? (totalVendas / qtdPedidos) : 0;
  
  document.getElementById('dash-metrics').innerHTML = `<div class="dash-card"><div class="dash-card-title">TOTAL DE VENDAS</div><div class="dash-card-value">R$ ${totalVendas.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div><div class="dash-card" style="border-bottom: 4px solid #004AAD;"><div class="dash-card-title">PEDIDOS CONCLUÍDOS</div><div class="dash-card-value">${qtdPedidos}</div></div><div class="dash-card" style="border-bottom: 4px solid var(--gold);"><div class="dash-card-title">TICKET MÉDIO</div><div class="dash-card-value">R$ ${ticketMedio.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>`;
  
  const ranking = {};
  pedidosFinalizados.forEach(pedido => { pedido.dishes.forEach(prato => { ranking[prato.name] = (ranking[prato.name] || 0) + prato.qty; }); });
  const topPratos = Object.entries(ranking).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 4);
  document.getElementById('trending-dishes').innerHTML = topPratos.length ? topPratos.map((p, i) => {
    const infoPrato = state.dishes.find(d => d.name === p.name);
    const imgSrc = (infoPrato && infoPrato.img) ? `<img src="${infoPrato.img}" class="pratos-alta-img">` : `<div class="pratos-alta-img" style="display:flex;align-items:center;justify-content:center;font-size:24px">🍽️</div>`;
    return `<div class="pratos-alta-item">${imgSrc}<div style="flex:1;"><div style="font-weight: 700; font-size: 15px;">${p.name}</div><div style="font-size: 13px; font-weight: 500; color: #555;">${p.qty} vendas</div></div><div style="color: var(--gold); font-size: 20px;">${i === 0 ? '★' : '↗'}</div></div>`;
  }).join('') : '<p style="color:#555; font-size:14px; font-weight: 500;">Nenhum pedido finalizado.</p>';
  
  document.getElementById('recent-orders-body').innerHTML = pedidosFinalizados.slice(-6).reverse().map(o => `<tr><td style="font-weight:800;">#${o.id}</td><td>${o.table}</td><td>${o.dishes.map(d=>d.name).join(', ')}</td><td style="color:var(--green);font-weight:bold;">CONCLUÍDO</td><td style="font-weight:800;">R$ ${o.total.toFixed(2)}</td></tr>`).join('') || '<tr><td colspan="5">Sem pedidos finalizados</td></tr>';
  
  const bars = [40, 60, 45, 80, 55, 90, 70, 85];
  const max = Math.max(...bars);
  document.getElementById('chart-bars').innerHTML = bars.map(v => `<div class="chart-bar" style="height:${(v/max)*100}%; background:var(--gold-pale);"></div>`).join('');
  document.getElementById('chart-labels').innerHTML = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO'].map(l => `<div class="chart-label">${l}</div>`).join('');
}

function renderCardapio() {
  const abas = ['Todas', ...state.categories];
  document.getElementById('category-filters').innerHTML = abas.map(cat => `<div class="cat-tab ${currentCatFilter === cat ? 'active' : ''}" onclick="filterCat('${cat}')">${cat}</div>`).join('');
  document.getElementById('dish-category').innerHTML = state.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  const pratosExibidos = currentCatFilter === 'Todas' ? state.dishes : state.dishes.filter(d => d.category === currentCatFilter);
  document.getElementById('balcao-dishes-grid').innerHTML = pratosExibidos.map(d => `<div class="dish-card-edit"><div class="dish-actions-corner"><button class="icon-btn edit-btn" onclick="editDish(${d.id})"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button><button class="icon-btn delete-btn" onclick="deleteDish(${d.id})"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div><img src="${d.img ? d.img : 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23eee%22/></svg>'}" class="dish-card-edit-img"><div class="dish-card-edit-body"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><h4 style="font-weight: 800; font-size:18px; color: var(--dark); margin:0;">${d.name}</h4><span style="font-weight:800; font-size: 16px; color:var(--gold);">R$ ${d.price.toFixed(2)}</span></div><p style="font-size:13px; font-weight: 500; color:#555; margin:8px 0; height:39px; overflow:hidden;">${d.desc || 'Sem descrição'}</p><div style="font-size:12px; font-weight: 600; color:#666;">👥 Serve ${d.serves || 1} pessoa(s) | 🏷️ ${d.category}</div></div></div>`).join('') || '<p style="grid-column:1/-1; text-align:center; padding:40px; color:#555;">Nenhum prato encontrado.</p>';
}

function filterCat(cat) { currentCatFilter = cat; renderCardapio(); }

function openCategoryModal() { document.getElementById('new-category-name').value = ''; document.getElementById('modal-addCategory').classList.add('open'); }

function saveCategory() {
  const nome = document.getElementById('new-category-name').value.trim();
  if (!nome) { showNotif('warning', 'Digite um nome válido.'); return; }
  state.categories.push(nome); salvarBanco(state); closeModal('addCategory'); atualizarTela(); showNotif('success', 'Categoria criada com sucesso!');
}

function handleImageUpload(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas'); const MAX_WIDTH = 600; const MAX_HEIGHT = 600; let width = img.width; let height = img.height;
      if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
      canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
      base64ImageTemp = canvas.toDataURL('image/jpeg', 0.6);
      document.getElementById('upload-placeholder').style.display = 'none'; const imgPrev = document.getElementById('dish-img-preview'); imgPrev.src = base64ImageTemp; imgPrev.style.display = 'block';
    }; img.src = e.target.result;
  }
  reader.readAsDataURL(file);
}

function openModal(id) {
  document.getElementById('modal-'+id).classList.add('open');
  if (id === 'addDish') {
    document.getElementById('edit-dish-id').value = ''; document.getElementById('dish-name').value = ''; document.getElementById('dish-price').value = ''; document.getElementById('dish-desc').value = ''; document.getElementById('dish-serves').value = '1'; base64ImageTemp = null; document.getElementById('upload-placeholder').style.display = 'block'; document.getElementById('dish-img-preview').style.display = 'none'; document.getElementById('modal-dish-title').textContent = 'Adicionar Novo Prato';
  }
}

function saveDish() {
  const id = document.getElementById('edit-dish-id').value; const name = document.getElementById('dish-name').value.trim(); const price = parseFloat(document.getElementById('dish-price').value); const category = document.getElementById('dish-category').value; const desc = document.getElementById('dish-desc').value.trim(); const serves = parseInt(document.getElementById('dish-serves').value) || 1;
  if (!name || isNaN(price)) { showNotif('warning', 'Preencha Nome e Valor.'); return; }
  if (id) { const index = state.dishes.findIndex(x => x.id == id); if (index > -1) { state.dishes[index] = { ...state.dishes[index], name, price, category, desc, serves }; if (base64ImageTemp) state.dishes[index].img = base64ImageTemp; } } else { state.dishes.push({ id: Date.now(), name, price, category, desc, serves, img: base64ImageTemp }); }
  salvarBanco(state); closeModal('addDish'); atualizarTela(); showNotif('success', 'Cardápio atualizado!');
}

function editDish(id) {
  const d = state.dishes.find(x => x.id == id); if(!d) return;
  document.getElementById('modal-dish-title').textContent = 'Editar Prato'; document.getElementById('edit-dish-id').value = d.id; document.getElementById('dish-name').value = d.name; document.getElementById('dish-price').value = d.price; document.getElementById('dish-category').value = d.category; document.getElementById('dish-desc').value = d.desc; document.getElementById('dish-serves').value = d.serves || 1;
  base64ImageTemp = d.img;
  if (d.img) { document.getElementById('upload-placeholder').style.display = 'none'; document.getElementById('dish-img-preview').src = d.img; document.getElementById('dish-img-preview').style.display = 'block'; } else { document.getElementById('upload-placeholder').style.display = 'block'; document.getElementById('dish-img-preview').style.display = 'none'; }
  document.getElementById('modal-addDish').classList.add('open');
}

function deleteDish(id) { if(confirm('Tem certeza que deseja excluir este prato?')) { state.dishes = state.dishes.filter(d => d.id !== id); salvarBanco(state); atualizarTela(); showNotif('success', 'Prato excluído.'); } }

function renderCustos() {
  let total = 0, fixo = 0, variavel = 0;
  state.costs.forEach(c => { total += c.value; if (c.type === 'Fixo') fixo += c.value; else variavel += c.value; });
  document.getElementById('cost-metrics').innerHTML = `<div class="dash-card" style="background: var(--dark); color: white;"><div class="dash-card-title" style="color: rgba(255,255,255,0.7);">TOTAL DE CUSTOS</div><div class="dash-card-value" style="color: white;">R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div><div class="dash-card"><div class="dash-card-title">📌 CUSTOS FIXOS</div><div class="dash-card-value">R$ ${fixo.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div><div class="dash-card"><div class="dash-card-title">📊 CUSTOS VARIÁVEIS</div><div class="dash-card-value">R$ ${variavel.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div></div>`;
  const formatarData = (isoStr) => { if(!isoStr) return ''; const d = new Date(isoStr); return `${String(d.getDate() + 1).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };
  document.getElementById('costs-body').innerHTML = state.costs.map(c => `<tr><td style="font-weight:700; font-size: 14px;">${c.item}</td><td><span style="font-size: 12px; font-weight: 800;">${c.type}</span></td><td style="color:#555; font-size: 14px; font-weight: 500;">${formatarData(c.date)}</td><td style="font-weight:800; font-size: 14px;">R$ ${c.value.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td><td style="color:var(--green); font-weight: 800;">PAGO</td><td><button class="icon-btn delete-btn" onclick="deleteCost(${c.id})"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></td></tr>`).join('') || '<tr><td colspan="6" style="text-align:center;">Nenhum custo lançado.</td></tr>';
}

function saveCost() {
  const item = document.getElementById('cost-item').value.trim(); const value = parseFloat(document.getElementById('cost-value').value); const type = document.getElementById('cost-type').value; const date = document.getElementById('cost-date').value;
  if (!item || isNaN(value) || !date) { showNotif('warning', 'Preencha todos os campos.'); return; }
  state.costs.push({ id: Date.now(), item, value, type, date, status: 'Pago' });
  salvarBanco(state); closeModal('addCost'); atualizarTela(); showNotif('success', 'Custo lançado com sucesso!');
  document.getElementById('cost-item').value = ''; document.getElementById('cost-value').value = '';
}

function deleteCost(id) { state.costs = state.costs.filter(c => c.id !== id); salvarBanco(state); atualizarTela(); showNotif('success', 'Custo removido.'); }

window.onload = () => { checkHighContrast(); document.getElementById('cost-date').valueAsDate = new Date(); atualizarTela(); };