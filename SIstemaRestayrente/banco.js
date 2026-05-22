const DB_KEY = 'restaurante_json_db';

const estadoInicial = {
  dishes: [
    { id:1, name:'Picanha Premium', price:145, serves:2, category:'Pratos Principais', desc:'Corte nobre de picanha grelhada na brasa.', img:null },
    { id:2, name:'Moqueca Baiana', price:189, serves:3, category:'Pratos Principais', desc:'Autêntica moqueca de peixe e camarão.', img:null },
    { id:3, name:'Feijoada Completa', price:98, serves:2, category:'Pratos Principais', desc:'Seleção de carnes nobres.', img:null },
    { id:4, name:'Dadinhos de Tapioca', price:42, serves:1, category:'Entradas', desc:'Cubos crocantes de tapioca com queijo coalho.', img:null }
  ],
  orders: [],
  costs: [
    { id:1, item:'Insumos', category:'Ingredientes', date:'2023-10-12', value:1250, status:'Pago' },
    { id:2, item:'Aluguel', category:'Aluguel', date:'2023-10-10', value:5500, status:'Pago' }
  ],
  tables: Array.from({length:12},(_,i)=>({ num:i+1, status:'free', orderId:null })),
  selectedTable: null,
  cart: [],
  account: { name:'Chef Silva', email:'chef@epicurean.com', emails:[] }
};

// SELECT
function lerBanco() {
  const dados = localStorage.getItem(DB_KEY);
  if (dados) {
    return JSON.parse(dados);
  } else {
    salvarBanco(estadoInicial);
    return estadoInicial;
  }
}

// UPDATE / INSERT
function salvarBanco(dados) {
  localStorage.setItem(DB_KEY, JSON.stringify(dados));
}

// Sincronização entre abas
window.addEventListener('storage', (e) => {
  if (e.key === DB_KEY) {
    if (typeof atualizarTela === 'function') {
      atualizarTela();
    }
  }
});

// Utilidade de Notificação Global
let notifTimeout = null;
function showNotif(icon, msg){
  const el = document.getElementById('notif');
  if(!el) return;
  document.getElementById('notif-icon').textContent = icon;
  document.getElementById('notif-msg').textContent = msg;
  el.classList.add('show');
  if(notifTimeout) clearTimeout(notifTimeout);
  notifTimeout = setTimeout(()=>el.classList.remove('show'), 3000);
}