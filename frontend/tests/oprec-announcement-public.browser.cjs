// Production Next proxy + synthetic backend. No database or real participant data.
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

async function main() {
  let release = Date.now() + 15000; let lookups = 0; let metadataReads = 0;
  const metadata = () => ({ exists: true, title: 'Pengumuman OPREC 2026/2027', release_at: new Date(release).toISOString(), released: Date.now() >= release, description: 'Hasil seleksi telah tersedia.', poster_url: null });
  const backend = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    let data = {}; let status = 200;
    if (req.url === '/api/public/oprec') data = { data: { id: 900, periode: '2026/2027', status: 'closed', formFields: [], faq: [], divisiTersedia: [], announcement: metadata(), serverNow: new Date().toISOString() } };
    else if (req.url.endsWith('/announcement')) { metadataReads++; data = { data: metadata(), server_now: new Date().toISOString() }; }
    else if (req.url.endsWith('/verify')) {
      lookups++; const input = JSON.parse(body);
      assert.equal(input.nim, 'E3124001');
      if (input.tanggal_lahir !== '2004-01-01') { status = 404; data = { message: 'Data tidak ditemukan.' }; }
      else data = { ticket: 'synthetic-encrypted-ticket', expires_in: 1800 };
    } else if (req.url.endsWith('/announcement/result')) {
      assert.equal(JSON.parse(body).ticket, 'synthetic-encrypted-ticket');
      data = { data: { status: 'accepted', period: '2026/2027', name: 'Nadia Putri', nim: 'E3124001', division: 'BPH', position: 'Ketua Umum', whatsapp_url: 'https://chat.whatsapp.com/SyntheticTest' } };
    } else { status = 404; }
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data));
  });
  await new Promise(resolve => backend.listen(19091, '127.0.0.1', resolve));
  const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3008'], { env: { ...process.env, NEXT_DIST_DIR: '.next-announcement-check', API_BASE_URL: 'http://127.0.0.1:19091/api' }, stdio: 'ignore' });
  let socket;
  try {
    for (let i = 0; i < 50; i++) { try { if ((await fetch('http://localhost:3008/oprec')).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    const targets = await fetch('http://127.0.0.1:9335/json').then(r => r.json());
    socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    const pending = new Map(); const errors = []; let sequence = 0;
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(Error(method)); }, 15000); pending.set(id, { resolve: r => { clearTimeout(timer); resolve(r); }, reject }); socket.send(JSON.stringify({ id, method, params })); });
    socket.addEventListener('message', ({ data }) => {
      const event = JSON.parse(data);
      if (event.id) { const cb = pending.get(event.id); pending.delete(event.id); if (event.error) cb?.reject(Error(event.error.message)); else cb?.resolve(event.result); }
      if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
      if (event.method === 'Fetch.requestPaused') send('Fetch.fulfillRequest', { requestId: event.params.requestId, responseCode: 401, responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: 'http://localhost:3008' }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{}').toString('base64') }).catch(e => errors.push(e.message));
    });
    const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
    const waitFor = async expression => { for (let i = 0; i < 220; i++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(r => setTimeout(r, 100)); } throw Error('Missing: ' + expression); };
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*api/auth/me*' }] });
    release = Date.now() + 10000;
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:3008/oprec#pengumuman' });
    await waitFor(`document.querySelector('.oa-countdown')`);
    assert.equal(await evaluate(`document.querySelector('.oa-public-card button').disabled`), true);
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
    await waitFor(`document.querySelector('.oa-public-card button')?.disabled === false`);
    assert.ok(metadataReads <= 2, 'Countdown must not poll API every second');
    await evaluate(`document.querySelector('.oa-public-card button').click()`);
    await waitFor(`document.querySelector('#announcement-nim')`);
    await evaluate(`document.querySelector('#announcement-nim').focus()`); await send('Input.insertText', { text: 'e3124001' });
    assert.equal(await evaluate(`document.querySelector('#announcement-nim').value`), 'E3124001');
    await evaluate(`{ const input=document.querySelector('#announcement-birth'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2004-01-01');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true})); }`);
    await evaluate(`document.querySelector('.oa-dialog form').requestSubmit()`);
    await waitFor(`document.querySelector('.oa-result h1')?.textContent === 'Selamat, kamu diterima!'`);
    assert.equal(lookups, 1);
    assert.equal(await evaluate('location.search'), '');
    assert.equal(await evaluate(`document.querySelectorAll('.oa-result img').length`), 0);
    assert.equal(await evaluate(`document.cookie.includes('oprec_result_')`), false);
    const cookies = await send('Network.getCookies', { urls: ['http://localhost:3008/oprec/pengumuman/900'] });
    const ticket = cookies.cookies.find(c => c.name === 'oprec_result_900');
    assert.ok(ticket?.httpOnly); assert.equal(ticket.path, '/oprec/pengumuman/900');
    await send('Page.reload'); await waitFor(`document.querySelector('.oa-result-grid')?.textContent.includes('Nadia Putri')`);
    for (const width of [320, 390, 768, 1280, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `Result overflow ${width}`);
      const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`.next-announcement-check/result-${width}.png`, Buffer.from(shot.data, 'base64'));
    }
    assert.deepEqual(errors, []);
    await send('Fetch.disable');
    console.log('PASS: countdown release, no per-second API polling, uppercase NIM, real Next verification proxy, HttpOnly cookie, result refresh, no poster/identity in URL, five responsive viewports. Backend responses are fixtures.');
  } finally { socket?.close(); next.kill(); backend.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
