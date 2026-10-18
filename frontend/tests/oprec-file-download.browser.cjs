// Production Next + synthetic API + isolated Chrome profile; no real account or database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function main() {
  const origin = 'http://localhost:3016';
  const profile = path.resolve('.next', `oprec-file-browser-${process.pid}`);
  const downloads = path.resolve('.next', `oprec-file-downloads-${process.pid}`);
  fs.mkdirSync(downloads, { recursive: true });
  const pdfPath = path.join(downloads, 'replacement.pdf');
  const pdf = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF';
  fs.writeFileSync(pdfPath, pdf);
  let restored = false;
  let fileRequests = 0;
  const errors = [];
  const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3016'], { stdio: ['ignore', 'ignore', 'pipe'] });
  next.stderr.on('data', data => process.stderr.write(data));
  const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=19446', '--user-data-dir=' + profile, 'about:blank',
  ], { stdio: 'ignore' });
  let socket;
  try {
    let target;
    for (let i = 0; i < 100; i++) {
      try {
        target = (await fetch('http://127.0.0.1:19446/json').then(response => response.json())).find(item => item.type === 'page');
        if (target && (await fetch(origin + '/admin/oprec')).ok) break;
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
    const registrant = () => ({ id: 100, name: 'Peserta Uji', nim: 'E3124001', tanggalLahir: '2004-01-01',
      divisiPilihan1: 1, divisiPilihan2: 2, divisiPilihan3: 3, formData: { nama: 'Peserta Uji', angkatan: '2024' },
      fileUploads: { portfolio: { field: 'portfolio', available: restored,
        downloadUrl: restored ? 'http://wrong-host.test/api/admin/oprec/900/registrants/100/files/portfolio' : null,
        fileName: 'oprec-100-portfolio.pdf' } } });
    const period = { id: 900, periode: '2026/2027', status: 'closed', headline: 'OPREC Uji', schemaVersion: '1',
      tanggalBuka: '2026-10-01T00:00:00+07:00', tanggalTutup: '2026-10-10T23:59:00+07:00',
      divisiTersedia: [1, 2, 3].map(id => ({ id, nama: `Divisi ${id}` })),
      formFields: [{ name: 'portfolio', type: 'file', label: 'Portofolio', accept: ['.pdf'] }] };
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
          let status = 200; let payload = {};
          let type = 'application/json';
          if (request.method === 'OPTIONS') status = 204;
          else if (url.pathname.endsWith('/auth/me')) payload = { data: { id: 1, name: 'Admin Uji', role: 'admin' } };
          else if (url.pathname === '/api/admin/oprec') payload = { data: [period] };
          else if (url.pathname === '/api/admin/oprec/900/registrants') payload = { data: [registrant()], current_page: 1, last_page: 1, total: 1, per_page: 20 };
          else if (url.pathname.endsWith('/files/portfolio') && request.method === 'POST') {
            restored = true;
            payload = { data: registrant().fileUploads.portfolio };
          } else if (url.pathname.endsWith('/files/portfolio') && request.method === 'GET') {
            fileRequests++;
            payload = pdf;
            type = 'application/pdf';
          } else status = 404;
          await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
            { name: 'Content-Type', value: type }, { name: 'Access-Control-Allow-Origin', value: origin },
            { name: 'Access-Control-Allow-Credentials', value: 'true' },
            { name: 'Access-Control-Allow-Headers', value: 'accept,content-type,x-requested-with,x-xsrf-token' },
            { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          ], body: Buffer.from(type === 'application/pdf' ? payload : JSON.stringify(payload)).toString('base64') });
        })().catch(error => errors.push(error.message));
      }
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async condition => {
      for (let i = 0; i < 150; i++) {
        if (await condition()) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw Error('Timed out waiting for browser state: ' + await evaluate('document.body?.innerText.slice(-600)') + '; ' + errors.join(', '));
    };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*api/*' }] });
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: true });
    await send('Page.navigate', { url: origin + '/admin/oprec' });
    await waitFor(() => evaluate('Boolean(document.querySelector(".oprec-file-missing"))'));
    assert.equal(fileRequests, 0, 'missing file must not trigger a download');
    await evaluate('document.querySelector(".oprec-file-missing").click()');
    await waitFor(() => evaluate('Boolean(document.querySelector(".oprec-file-restore input"))'));
    const document = await send('DOM.getDocument');
    const input = await send('DOM.querySelector', { nodeId: document.root.nodeId, selector: '.oprec-file-restore input' });
    await send('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [pdfPath] });
    await waitFor(() => evaluate('Boolean(document.querySelector(".oprec-file-download"))'));
    await evaluate('document.querySelector(".oprec-file-download").click()');
    const resultPath = path.join(downloads, 'oprec-100-portfolio.pdf');
    await waitFor(() => fs.existsSync(resultPath));
    assert.equal(fs.readFileSync(resultPath, 'utf8'), pdf);
    assert.equal(fileRequests, 1);
    assert.deepEqual(errors, []);
    console.log('PASS: missing file prompts restoration, then the authenticated download writes the PDF to disk.');
  } finally {
    socket?.close(); chrome.kill(); next.kill();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
