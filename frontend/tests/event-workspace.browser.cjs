/* UI smoke test using Chrome DevTools Protocol, no added dependency.
 * Start Next on :3100 and an isolated Chrome with --remote-debugging-port=9333.
 * All API responses are fixtures; this test does not write application data.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const targets = await fetch('http://127.0.0.1:9333/json').then((r) => r.json());
  const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const callbacks = new Map();
  const errors = [];
  let requestFailure = false;
  const fields = [
    { name: 'nama', label: 'Nama lengkap', type: 'text', required: true, options: [] },
    { name: 'institusi', label: 'Institusi', type: 'text', required: true, options: [] },
    { name: 'email', label: 'Email aktif', type: 'email', required: true, options: [] },
    { name: 'telepon', label: 'Nomor WhatsApp', type: 'tel', required: true, options: [] },
    { name: 'bukti', label: 'Bukti twibbon', type: 'file', required: false, options: [] },
  ];
  const fixture = {
    event: { id: 900, judul: 'Game Development', slug: 'game-development', kategori: 'hi-fest', tipePendaftaran: 'tim', formFields: fields },
    paymentStatus: 'unpaid', htm: 50000,
    team: { id: 91, name: 'Byte Builders', code: 'HACK01', memberCount: 2, minMembers: 3, maxMembers: 5, isLeader: true, membershipStatus: 'accepted', canManage: true, lockReason: null,
      members: [{ id: 501, name: 'Ketua Pengujian', role: 'leader', isYou: true, status: 'accepted' }, { id: 502, name: 'Anggota Pengujian', role: 'member', isYou: false, status: 'accepted' }],
      requests: [{ id: 503, name: 'Calon Anggota', role: 'member', isYou: false, status: 'pending' }] },
    form: { submitted: false, canSubmit: true, reviewStatus: null, note: null, lockReason: null, answers: [] },
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { callbacks.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      callbacks.set(id, { resolve: (value) => { clearTimeout(timeout); resolve(value); }, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function intercept(event) {
    const { request, requestId } = event;
    const url = new URL(request.url);
    let payload; let responseCode = 200;
    if (request.method === 'OPTIONS') payload = {};
    else if (url.pathname.endsWith('/auth/me')) payload = { data: { id: 501, name: 'Ketua Pengujian', namaLengkap: 'Ketua Pengujian', role: 'user' } };
    else if (url.pathname.endsWith('/workspace')) {
      payload = requestFailure ? { message: 'Layanan sedang tidak tersedia.' } : { data: fixture };
      if (requestFailure) responseCode = 503;
    } else if (url.pathname.includes('/members/')) {
      const id = Number(url.pathname.split('/').at(-1));
      const action = JSON.parse(request.postData).action;
      if (action === 'accept') {
        const person = fixture.team.requests.find((member) => member.id === id);
        fixture.team.members.push({ ...person, status: 'accepted' });
        fixture.team.requests = fixture.team.requests.filter((member) => member.id !== id);
      } else fixture.team.members = fixture.team.members.filter((member) => member.id !== id);
      fixture.team.memberCount = fixture.team.members.length;
      payload = { data: { updated: true } };
    } else if (url.pathname.endsWith('/register')) {
      fixture.form = { ...fixture.form, submitted: true, canSubmit: false, reviewStatus: 'pending', answers: [{ name: 'nama', label: 'Nama lengkap', type: 'text', value: 'Ketua Pengujian' }] };
      payload = { data: { submitted: true } }; responseCode = 201;
    } else { payload = { data: null }; }
    await send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3100' },
      { name: 'Access-Control-Allow-Credentials', value: 'true' },
      { name: 'Access-Control-Allow-Headers', value: 'accept,content-type,x-requested-with,x-xsrf-token' },
      { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
    ], body: Buffer.from(JSON.stringify(payload)).toString('base64') });
  }
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) {
      const callback = callbacks.get(event.id);
      callbacks.delete(event.id);
      if (event.error) callback?.reject(new Error(event.error.message));
      else callback?.resolve(event.result);
    } else if (event.method === 'Fetch.requestPaused') intercept(event.params).catch((error) => errors.push(error.message));
    else if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 100)); }
    throw new Error('Not found: ' + expression);
  };
  const click = (text) => evaluate(`Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === ${JSON.stringify(text)})?.click()`);
  const screenshot = async (name) => {
    const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.mkdirSync(path.join('.next', 'workspace-checks'), { recursive: true });
    fs.writeFileSync(path.join('.next', 'workspace-checks', name + '.png'), Buffer.from(image.data, 'base64'));
  };
  try {
    await send('Runtime.enable'); await send('Page.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*api/*' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:3100/dashboard/events/detail?id=900' });
    await waitFor(`document.body?.innerText.includes('Byte Builders')`);
    await screenshot('desktop');
    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth`), false);
    const beforeColor = await evaluate(`getComputedStyle(document.querySelector('[role="progressbar"] span')).backgroundColor`);
    await click('Terima');
    await waitFor(`document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow') === '3'`);
    assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('[role="progressbar"] span')).backgroundColor`), beforeColor);
    await evaluate(`document.querySelector('button[aria-label="Hapus Anggota Pengujian"]').click()`);
    await waitFor(`document.querySelector('dialog')?.open`);
    await click('Batal');
    assert.equal(fixture.team.memberCount, 3);
    await evaluate(`document.querySelector('button[aria-label="Hapus Anggota Pengujian"]').click()`);
    await click('Hapus anggota');
    await waitFor(`document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow') === '2'`);
    await evaluate(`for (const [name, value] of Object.entries({nama:'Ketua Pengujian',institusi:'Kampus Uji',email:'ui@example.test',telepon:'08123456789'})) document.querySelector('[name="'+name+'"]').value = value; document.querySelector('form').requestSubmit();`);
    await waitFor(`document.body?.innerText.includes('Formulir sudah tersimpan')`);
    assert.equal(await evaluate(`document.querySelector('form') === null`), true);
    for (const width of [320, 375, 768, 1024, 1280, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth`), false, `Overflow at ${width}px`);
      if (width === 375) await screenshot('mobile');
    }
    fixture.team.isLeader = false; fixture.team.canManage = false;
    fixture.team.membershipStatus = 'pending'; fixture.team.members = []; fixture.team.requests = [];
    fixture.team.code = null; fixture.form.submitted = false; fixture.form.canSubmit = false;
    await click('Perbarui');
    await waitFor(`document.body?.innerText.includes('Menunggu persetujuan ketua')`);
    assert.equal(await evaluate(`document.querySelector('form') === null`), true);
    requestFailure = true; await click('Perbarui');
    await waitFor(`document.querySelector('[role="alert"]') !== null`);
    requestFailure = false; await click('Perbarui');
    await waitFor(`document.querySelector('[role="alert"]') === null`);
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`), true);
    assert.deepEqual(errors, []);
    console.log('PASS: desktop/mobile (320–1440px), approval, progress, remove confirmation/cancel, form submission, pending permissions, error recovery, reduced motion; no JS exceptions.');
  } finally { socket.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
