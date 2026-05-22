const DB_KEY = 'restaurante_json_db';

const estadoInicial = {
  dishes: [],
  categories: ['Entradas', 'Pratos Principais', 'Sobremesas', 'Bebidas'],
  orders: [],
  costs: [],
  estoque: [],
  tables: Array.from({length:12}, (_,i)=>({ num:i+1, status:'free', orderId:null }))
};

function lerBanco() {
  const dados = localStorage.getItem(DB_KEY);
  if (dados) return JSON.parse(dados);
  salvarBanco(estadoInicial);
  return estadoInicial;
}

function salvarBanco(dados) {
  localStorage.setItem(DB_KEY, JSON.stringify(dados));
}

// Ouve atualizações de outras abas
window.addEventListener('storage', (e) => {
  if (e.key === DB_KEY && typeof atualizarTela === 'function') {
    atualizarTela();
  }
});

// Acessibilidade: Alto Contraste Global
function checkHighContrast() {
  if (localStorage.getItem('theme-hc') === 'true') {
    document.body.classList.add('high-contrast');
  }
}

function toggleHighContrast() {
  const isHC = document.body.classList.toggle('high-contrast');
  localStorage.setItem('theme-hc', isHC);
}

// Notificações Globais
function showNotif(type, msg){
  const el = document.getElementById('notif');
  if(!el) return;
  const container = document.getElementById('notif-icon-container');
  
  const icons = {
    'success': `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    'error': `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    'warning': `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
  };

  el.className = `notif ${type}`;
  container.innerHTML = icons[type] || icons['success'];
  document.getElementById('notif-msg').textContent = msg;
  
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

// Utils: Fechar Modal
function closeModal(id) {
  const el = document.getElementById('modal-'+id);
  if(el) el.classList.remove('open');
}