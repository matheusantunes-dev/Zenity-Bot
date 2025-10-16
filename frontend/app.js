
// ---- Navegação ----
document.querySelectorAll('.icon-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-target');
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) target.classList.remove('hidden');
  });
});

let token = localStorage.getItem('token') || '';
function authHeaders(){ return { 'Authorization':'Bearer '+token, 'Content-Type':'application/json' }; }

async function signup(){
  try {
    const r = await fetch('/api/auth/signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: su_user.value.trim(), password: su_pass.value })
    });
    const j = await r.json().catch(()=>({}));
    authStatus.textContent = JSON.stringify(j);
    if (j.token){ token = j.token; localStorage.setItem('token', token); await refresh(); }
  } catch(e){ authStatus.textContent = 'erro'; }
}

async function login(){
  try {
    const r = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: li_user.value.trim(), password: li_pass.value })
    });
    const j = await r.json().catch(()=>({}));
    authStatus.textContent = JSON.stringify(j);
    if (j.token){ token = j.token; localStorage.setItem('token', token); await refresh(); }
  } catch(e){ authStatus.textContent = 'erro'; }
}

function renderGroups(arr){
  const box = document.getElementById('groupCheckboxes');
  box.innerHTML = '';
  (arr||[]).forEach(id => {
    const label = document.createElement('label'); label.className='group-item';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.value=id; cb.checked=true;
    const span = document.createElement('span'); span.className='id'; span.textContent=id;
    label.appendChild(cb); label.appendChild(span); box.appendChild(label);
  });
}
function marcar(on){
  document.querySelectorAll('#groupCheckboxes input[type=checkbox]').forEach(c=> c.checked=on);
}

async function refresh(){
  if (!token) return;
  try{
    const p = await fetch('/api/power', { headers:authHeaders() }).then(r=>r.json());
    powerState.textContent = p.disabled ? 'Desligado' : 'Ligado';
    message.value = await fetch('/api/message', { headers:authHeaders() }).then(r=>r.text());
    const g = await fetch('/api/groups', { headers:authHeaders() }).then(r=>r.json());
    if(Array.isArray(g) && g.length) renderGroups(g);
    schedule.value = await fetch('/api/schedule', { headers:authHeaders() }).then(r=>r.text());
  }catch(e){}
}

async function setPower(off){
  await fetch('/api/power', { method:'POST', headers:authHeaders(), body: JSON.stringify({ on: !off }) });
  refresh();
}
async function saveMessage(){
  await fetch('/api/message', { method:'POST', headers:authHeaders(), body: JSON.stringify({ text: message.value }) });
  msgStatus.textContent='Salvo.';
  setTimeout(()=> msgStatus.textContent='', 1500);
}
async function saveGroups(){
  const selected = Array.from(document.querySelectorAll('#groupCheckboxes input[type=checkbox]'))
    .filter(c=>c.checked).map(c=>c.value);
  await fetch('/api/groups', { method:'POST', headers:authHeaders(), body: JSON.stringify(selected) });
  grpStatus.textContent='Salvo.';
  setTimeout(()=> grpStatus.textContent='', 1500);
}
async function saveSchedule(){
  await fetch('/api/schedule', { method:'POST', headers:authHeaders(), body: JSON.stringify({ text: schedule.value }) });
  schStatus.textContent='Salvo.';
  setTimeout(()=> schStatus.textContent='', 1500);
}

// Enviar teste via Cloud API (backend chama o Facebook)
async function sendTest(){
  try{
    sendStatus.textContent = 'Enviando...';
    const to = document.getElementById('testTo').value.trim();
    const text = document.getElementById('testText').value;
    const r = await fetch('/api/send', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ to, text })
    });
    const j = await r.json().catch(()=>({}));
    sendStatus.textContent = r.ok ? 'OK' : ('Erro: ' + (j.error||r.status));
  }catch(e){ sendStatus.textContent = 'Erro.'; }
}
refresh();
