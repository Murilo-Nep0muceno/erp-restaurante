function realizarLogin(event) {
  event.preventDefault();
  const user = document.getElementById('username').value.trim().toLowerCase();
  const pass = document.getElementById('password').value.trim();
  const erroEl = document.getElementById('login-erro');

  erroEl.style.display = 'none';

  if (user === 'admin' && pass === 'admin') window.location.href = 'balcao.html';
  else if (user === 'cozinha' && pass === 'cozinha') window.location.href = 'cozinha.html';
  else if (user === 'garcom' && pass === 'garcom') window.location.href = 'garcom.html';
  else {
    erroEl.style.display = 'block';
    const box = document.getElementById('login-box');
    box.style.transform = 'translateX(10px)';
    setTimeout(() => box.style.transform = 'translateX(-10px)', 100);
    setTimeout(() => box.style.transform = 'translateX(10px)', 200);
    setTimeout(() => box.style.transform = 'translateX(0)', 300);
  }
}