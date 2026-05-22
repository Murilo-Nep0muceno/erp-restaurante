let state = lerBanco();
let currentCat = 'Todas';

function atualizarTela() {
  state = lerBanco();
  if(!state.categories) state.categories = ['Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas'];
  if(!state.dishes) state.dishes = [];
  renderCategories();
  renderClientMenu();
}

function renderCategories() {
  const abas = ['Todas', ...state.categories];
  const container = document.getElementById('client-cat-filters');
  if(state.dishes.length === 0) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  container.innerHTML = abas.map(cat => `<div class="cat-pill ${cat === currentCat ? 'active' : ''}" onclick="filterMenu('${cat}')">${cat}</div>`).join('');
}

function filterMenu(cat) {
  currentCat = cat;
  renderCategories();
  renderClientMenu();
  window.scrollTo({ top: document.querySelector('.client-categories').offsetTop - 10, behavior: 'smooth' });
}

function renderClientMenu() {
  const grid = document.getElementById('client-dishes-grid');
  if (state.dishes.length === 0) {
    grid.innerHTML = `<div class="empty-state"><h3>Cardápio em Atualização</h3></div>`;
    return;
  }
  const pratosExibidos = currentCat === 'Todas' ? state.dishes : state.dishes.filter(d => d.category === currentCat);
  if (pratosExibidos.length === 0) {
    grid.innerHTML = `<div class="empty-state"><p>Nenhum prato disponível nesta categoria.</p></div>`;
    return;
  }

  const svgPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect><circle cx='8.5' cy='8.5' r='1.5'></circle><polyline points='21 15 16 10 5 21'></polyline></svg>`;

  grid.innerHTML = pratosExibidos.map(d => `
    <div class="client-dish">
      <div class="client-dish-img"><img src="${d.img ? d.img : svgPlaceholder}" alt="${d.name}" style="${d.img ? '' : 'width:80px; height:80px; object-fit:contain; opacity:0.5;'}"></div>
      <div class="client-dish-body">
        <div class="client-dish-header">
          <div class="client-dish-name">${d.name}</div>
          <div class="client-dish-price">R$ ${d.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
        </div>
        ${d.desc ? `<div class="client-dish-desc">${d.desc}</div>` : ''}
        <div class="client-dish-meta">Serve ${d.serves || 1} pessoa(s)</div>
      </div>
    </div>
  `).join('');
}

window.onload = () => {
  checkHighContrast();
  atualizarTela();
};