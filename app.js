const API = '/api'; // served from same origin
let currentUser = null;
let currentChat = null; // username of the contact opened

// helper
const el = id => document.getElementById(id);

// Auth
el('btnRegister').addEventListener('click', async () => {
  const username = el('username').value.trim();
  const password = el('password').value;
  const r = await fetch('/api/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  const j = await r.json();
  el('authMsg').textContent = j.success ? 'Inscription OK, connectez-vous' : (j.message||'Erreur');
  if(j.success){ el('username').value = username; el('password').value=''; }
});

el('btnLogin').addEventListener('click', async () => {
  const username = el('username').value.trim();
  const password = el('password').value;
  const r = await fetch('/api/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  const j = await r.json();
  if(j.success){ currentUser = username; startChatUI(); }
  else el('authMsg').textContent = j.message || 'Erreur';
});

async function startChatUI(){
  el('auth').style.display='none';
  el('chat').style.display='flex';
  el('me').textContent = currentUser;
  await refreshUsers();
  await refreshMessages();
  // populate toSelect options
  await populateToSelect();
  setInterval(()=>{ refreshMessages(); }, 2000);
}

async function refreshUsers(){
  const r = await fetch('/api/users');
  const users = await r.json();
  const ul = el('usersList'); ul.innerHTML='';
  users.filter(u=>u!==currentUser).forEach(u=>{
    const li = document.createElement('li');
    li.onclick = ()=> openPrivate(u);
    const avatar = document.createElement('div'); avatar.className='avatar'; avatar.textContent = u.charAt(0).toUpperCase();
    const name = document.createElement('div'); name.textContent = u;
    li.appendChild(avatar); li.appendChild(name);
    ul.appendChild(li);
  });
}

async function populateToSelect(){
  const sel = el('toSelect');
  sel.innerHTML = '<option value="ALL">Tous (public)</option>';
  const r = await fetch('/api/users'); const users = await r.json();
  users.forEach(u=>{
    const opt = document.createElement('option'); opt.value = u; opt.textContent = u; sel.appendChild(opt);
  });
}

function openPrivate(username){
  currentChat = username;
  el('chatHeader').textContent = 'Conversation avec ' + username;
  // set composer to send to that user
  el('toSelect').value = username;
  refreshMessages();
}

async function refreshMessages(){
  if(!currentUser) return;
  const r = await fetch('/api/messages/' + encodeURIComponent(currentUser));
  const msgs = await r.json();
  // show only messages relevant to current chat (if any) otherwise show global
  const container = el('messages'); container.innerHTML='';
  const visible = currentChat ? msgs.filter(m => (m.from===currentChat && m.to===currentUser) || (m.from===currentUser && m.to===currentChat)) : msgs;
  visible.forEach(m=>{
    const d = document.createElement('div'); d.className='message ' + (m.from===currentUser ? 'me' : 'other');
    d.innerHTML = '<div class="meta">' + (m.to==='ALL' ? 'Public' : (m.from===currentUser ? 'To ' + m.to : 'From ' + m.from)) + ' — ' + m.time + '</div>' + '<div>' + escapeHtml(m.text) + '</div>';
    container.appendChild(d);
  });
  container.scrollTop = container.scrollHeight;
}

// send
el('sendBtn').addEventListener('click', async ()=> sendMessage());
async function sendMessage(){
  const text = el('msgInput').value.trim();
  if(!text) return;
  const to = el('toSelect').value;
  await fetch('/api/message', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:currentUser,to,text})});
  el('msgInput').value='';
  refreshMessages();
}

function escapeHtml(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

