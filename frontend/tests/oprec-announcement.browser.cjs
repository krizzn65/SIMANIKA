// Isolated Chrome :9335 and production build :3007. API fixtures only; no user data is changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function main() {
  const targets = await fetch('http://127.0.0.1:9335/json').then(r => r.json());
  const socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const pending = new Map(); const errors = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(Error(method)); }, 15000);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) { const cb = pending.get(event.id); pending.delete(event.id); if (event.error) cb?.reject(Error(event.error.message)); else cb?.resolve(event.result); }
    if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
    if (event.method === 'Fetch.requestPaused') {
      const { requestId, request } = event.params;
      const pathname = new URL(request.url).pathname;
      let body = { data: null };
      if (pathname.endsWith('/auth/me')) body = { data: { id: 1, name: 'Admin Uji', role: 'super_admin' } };
      if (pathname.endsWith('/oprec/announcements')) body = { can_manage: true, data: [{ id: 900, periode: '2026/2027' }] };
      if (pathname.endsWith('/announcement')) body = {
        period: { id: 900, periode: '2026/2027' }, announcement: { exists: false, title: 'Pengumuman OPREC 2026/2027', description: '', whatsapp_url: '', release_at: null, released: false, poster_url: null }, blockers: [],
        participants: { total: 1, current_page: 1, last_page: 1, per_page: 20, data: [{ id: 5, name: 'Nadia Putri', nim: 'E3124001', division: 'BPH', position: 'Ketua Umum' }] },
      };
      send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3007' },
        { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'accept,content-type,x-requested-with,x-xsrf-token' },
        { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
      ], body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch(e => errors.push(e.message));
    }
  });
  const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const waitFor = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(r => setTimeout(r, 100)); } throw Error('Missing: ' + expression); };
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: '*api/*' }] });
    await send('Page.navigate', { url: 'http://localhost:3007/admin/oprec/pengumuman' });
    await waitFor(`document.querySelector('.oa-table tbody')?.textContent.includes('Nadia Putri')`);
    for (const width of [320, 390, 768, 1280, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `Page overflow ${width}`);
      await evaluate(`{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Buat pengumuman');button.focus();button.click();}`);
      await waitFor(`document.querySelector('[role="dialog"]')`);
      assert.equal(await evaluate(`document.querySelector('[role="dialog"]').contains(document.activeElement)`), true);
      assert.equal(await evaluate(`document.querySelector('[role="dialog"]').getBoundingClientRect().right <= innerWidth`), true);
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`.next-announcement-check/announcement-${width}.png`, Buffer.from(screenshot.data, 'base64'));
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await waitFor(`!document.querySelector('[role="dialog"]')`);
      await waitFor(`document.activeElement?.textContent.trim() === 'Buat pengumuman'`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: announcement admin fixtures, 5 viewports, dialog focus, Escape, focus restoration, no page overflow/runtime exceptions.');
  } finally { await send('Fetch.disable'); socket.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
