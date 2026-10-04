/**
 * The four pages the gateway renders itself. Everything else the person sees is
 * the Harness client or the applications' own screens.
 *
 * Self-contained (no external fonts, scripts or images), readable in light and
 * dark, and usable at phone width.
 */

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const STYLE = `
:root{--bg:#f7f8fa;--card:#ffffff;--ink:#14161a;--muted:#5d6470;--line:#dfe3e8;--accent:#2f5bd3;--accent-ink:#ffffff;--danger:#b42318}
@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--card:#171a20;--ink:#e8eaee;--muted:#9aa3af;--line:#2a2f38;--accent:#7aa2ff;--accent-ink:#0f1115;--danger:#ff8a80}}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:grid;place-items:center;padding:16px}
main{width:100%;max-width:400px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:28px}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 16px;color:var(--muted)}
label{display:block;font-weight:600;margin:14px 0 6px}
input{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--ink);font:inherit}
input:focus{outline:2px solid var(--accent);outline-offset:1px}
button,a.button{display:inline-block;margin-top:20px;width:100%;padding:10px 14px;border:0;border-radius:8px;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:600;text-align:center;text-decoration:none;cursor:pointer}
button[disabled]{opacity:.6;cursor:progress}
.error{color:var(--danger);min-height:1.5em;margin:12px 0 0}
.note{font-size:13px;margin-top:18px}
`;

function shell(title: string, body: string, script = ""): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>${STYLE}</style></head><body><main>${body}</main>${script ? `<script>${script}</script>` : ""}</body></html>`;
}

export function signInPage(base: string): string {
  return shell(
    "Sign in — Business chat",
    `<h1>Business chat</h1>
<p>Sign in with your account in the application. The chat, the application and its reports open together.</p>
<form id="sign-in" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="username" required>
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Sign in</button>
  <p class="error" id="error" role="alert"></p>
</form>
<p class="note">The assistant acts only as you: it can read what you can read and open the application's screens for you, and it never changes a record itself.</p>`,
    `const base=${JSON.stringify(base)};
const form=document.getElementById("sign-in"),error=document.getElementById("error"),button=form.querySelector("button");
form.addEventListener("submit",async(event)=>{event.preventDefault();error.textContent="";button.disabled=true;
try{const response=await fetch(base+"/_/auth/sign-in/application",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
body:JSON.stringify({email:form.email.value,password:form.password.value})});
if(response.ok){location.assign(base+"/");return}
const body=await response.json().catch(()=>({}));
error.textContent=response.status===429?"Too many attempts. Wait a minute and try again.":(body.message||"Sign-in failed.");}
catch{error.textContent="The chat could not be reached."}finally{button.disabled=false}});`
  );
}

export function waitingPage(base: string, position: number): string {
  return shell(
    "Waiting — Business chat",
    `<h1>The chat is busy</h1>
<p>Every seat is taken right now. You are <strong id="position">number ${position}</strong> in the queue; this page opens the chat as soon as a seat is free.</p>`,
    `const base=${JSON.stringify(base)};
(async function wait(){try{const r=await fetch(base+"/_/queue",{credentials:"same-origin"});const b=await r.json();
if(!b.position){location.reload();return}document.getElementById("position").textContent="number "+b.position;}catch{}setTimeout(wait,1000)})();`
  );
}

export function notFoundPage(base: string): string {
  return shell(
    "Not found — Business chat",
    `<h1>Nothing here</h1><p>This link does not belong to your session, or it never existed.</p><a class="button" href="${escape(base)}/">Open the chat</a>`
  );
}

export function expiredPage(base: string, title: string): string {
  return shell(
    "Expired — Business chat",
    `<h1>This view has expired</h1><p>${escape(title)} was opened a while ago. Use <strong>Re-open</strong> on the card in the conversation to open it again.</p><a class="button" href="${escape(base)}/">Back to the chat</a>`
  );
}
