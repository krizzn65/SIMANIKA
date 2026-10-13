// Production Next and synthetic API with an isolated Chrome profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function main() {
  const origin = 'http://localhost:3017';
  const profile = path.resolve('.next', `admin-logs-browser-${process.pid}`);
  const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=19447', '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });
  const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3017'], { stdio: ['ignore', 'ignore', 'pipe'] });
  next.stderr.on('data', data => process.stderr.write(data));
  let socket;
  const errors = [];
  const requests = [];
  let role = 'super_admin';
  try {
    let target;
    for (let i = 0; i < 100; i++) {
      try {
        target = (await fetch('http://127.0.0.1:19447/json').then(response => response.json())).find(item => item.type === 'page');
        if (target && (await fetch(origin + '/admin/logs')).ok) break;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(target, 'Chrome and production Next must start');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    const pending = new Map(); let sequence = 0;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(Error(`Timed out: ${method}`)); }, 15000);
      pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const entry = { id: 11, createdAt: '2026-10-13T10:15:00+07:00', kind: 'activity', module: 'users', action: 'users.update',
      result: 'success', summary: 'Ubah data · Pengguna', actor: { id: 1, name: 'Admin Utama', role: 'super_admin' },
      target: { type: 'id', id: '8' }, httpStatus: 200 };
    socket.addEventListener('message', ({ data }) => {
      const event = JSON.parse(data);
      if (event.id) {
        const callback = pending.get(event.id); pending.delete(event.id);
        if (event.error) callback?.reject(Error(event.error.message)); else callback?.resolve(event.result);
      } else if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
      else if (event.method === 'Fetch.requestPaused') {
        (async () => {
          const { requestId, request } = event.params;
          const url = new URL(request.url);
          requests.push(url.pathname + url.search);
          let status = 200; let payload = {};
          if (request.method === 'OPTIONS') status = 204;
          else if (url.pathname.endsWith('/auth/me')) payload = { data: { id: 1, name: 'Admin Utama', role } };
          else if (url.pathname.endsWith('/admin/logs/11')) payload = { data: { ...entry, ipAddress: '127.0.0.1', requestId: 'test-request-id', method: 'PUT', route: 'api/admin/users/{id}',
            context: { fields: ['role'], before: { role: 'user' }, after: { role: 'leader' } } } };
          else if (url.pathname.endsWith('/admin/logs')) payload = { data: url.searchParams.get('kind') === 'security' ? [] : [entry],
            meta: { page: 1, lastPage: 1, perPage: 20, total: url.searchParams.get('kind') === 'security' ? 0 : 1 },
            stats: { total: 4, activity: 2, security: 1, errors: 1, failed: 1 } };
          else if (url.pathname.endsWith('/admin/dashboard')) payload = { stats: {}, activeOprec: null, recentRegistrations: [], recentEvents: [] };
          else status = 404;
          await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
            { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin },
            { name: 'Access-Control-Allow-Credentials', value: 'true' },
            { name: 'Access-Control-Allow-Headers', value: 'accept,content-type,x-requested-with,x-xsrf-token' },
            { name: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
          ], body: Buffer.from(JSON.stringify(payload)).toString('base64') });
        })().catch(error => errors.push(error.message));
      }
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 150; i++) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw Error(`Missing ${expression}; page: ` + await evaluate('document.body?.innerText.slice(-800)') + '; ' + errors.join(', '));
    };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*api/*' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: origin + '/admin/logs' });
    await waitFor('document.querySelector(".syslog-table tbody .syslog-detail-button")');
    assert.equal(await evaluate('document.body.innerText.includes("Log Sistem")'), true);
    assert.equal(await evaluate('document.querySelectorAll(".syslog-stat").length'), 4);
    const desktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('.next', `admin-logs-desktop-${process.pid}.png`), Buffer.from(desktop.data, 'base64'));
    await evaluate('document.querySelector(".syslog-detail-button").click()');
    await waitFor('document.querySelector(".syslog-change")');
    assert.equal(await evaluate('document.querySelector(".syslog-modal").innerText.includes("leader")'), true);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await waitFor('!document.querySelector(".syslog-modal")');
    for (const width of [320, 375, 768, 1024, 1280, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      if (width === 320) {
        const mobile = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.resolve('.next', `admin-logs-mobile-${process.pid}.png`), Buffer.from(mobile.data, 'base64'));
      }
      const overflow = await evaluate(`({scrollWidth: document.documentElement.scrollWidth, innerWidth, elements: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed').slice(0, 12).map(el => [el.tagName, el.className?.baseVal || el.className, Math.round(el.getBoundingClientRect().right)])})`);
      assert.equal(overflow.scrollWidth > overflow.innerWidth, false, `horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
    }
    await evaluate(`{ const select = document.querySelector('.syslog-filters select'); select.value = 'security'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('.syslog-filters button[type=submit]').click(); }`);
    await waitFor('document.body.innerText.includes("Belum ada catatan pada filter ini")');
    assert.ok(requests.some(request => request.includes('kind=security')));
    role = 'admin';
    await send('Page.navigate', { url: origin + '/admin/logs' });
    await waitFor('location.pathname === "/admin"');
    assert.equal(await evaluate('Array.from(document.querySelectorAll("a")).some(link => link.getAttribute("href") === "/admin/logs")'), false);
    assert.deepEqual(errors, []);
    console.log(`PASS: Super Admin log, detail, filters, six viewports, and Admin access guard. Screenshots: .next/admin-logs-{desktop,mobile}-${process.pid}.png`);
  } finally {
    socket?.close(); chrome.kill(); next.kill();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
