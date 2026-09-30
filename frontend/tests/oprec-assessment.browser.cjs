/* UI regression with isolated Chrome (:9334) and Next (:3000).
 * All API requests are intercepted with fixtures; no application data is changed.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const criteria = ['pemahaman', 'kepribadian', 'public_speaking', 'kejujuran', 'problem_solving', 'kerja_sama'];

async function main() {
  const targets = await fetch('http://127.0.0.1:9334/json').then((r) => r.json());
  const socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0; let role = 'super_admin'; let failSave = false; let failAssignment = false; let latestQuery = '';
  const callbacks = new Map(); const errors = []; const assigned = new Set([51]);
  const people = [{ id: 51, name: 'Ayu Penilai', email: 'ayu@example.test' }, { id: 52, name: 'Bima Pengurus', email: 'bima@example.test' }];
  const rows = [1, 2, 3].map((id) => ({ id, registration_id: id + 100, name: ['Nadia Putri', 'Raka Aditya', 'Salsabila Rahma'][id - 1], nim: `E312400${id}`, angkatan: '2024', formData: { alasan: 'Ingin berkontribusi dan belajar bekerja sama dalam organisasi.' }, fileUploads: {},
    choices: ['BPH', 'Humas', 'PSDM'].map((division, n) => ({ id: n + 1, order: n + 1, division, applied_position: n ? `Staff Divisi ${division}` : 'Sekretaris 2', positions: ['Sekretaris 2', `Staff Divisi ${division}`] })),
    review: { id: id + 200, reviewer_id: 1, reviewer_name: 'Penilai Uji', scores: Object.fromEntries(criteria.map((field) => [field, null])), total: null, comment: '' }, reviews: [], average: null, reviews_hidden: false,
    decision: { status: 'pending', division_id: null, division: null, position: null },
  }));
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { callbacks.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      callbacks.set(id, { resolve: (value) => { clearTimeout(timeout); resolve(value); }, reject: (error) => { clearTimeout(timeout); reject(error); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function intercept({ request, requestId }) {
    const url = new URL(request.url); let payload = {}; let responseCode = 200;
    if (request.method === 'OPTIONS') payload = {};
    else if (url.pathname.endsWith('/auth/me')) payload = { data: { id: 1, name: 'Penilai Uji', role } };
    else if (url.pathname.endsWith('/oprec/assessments')) payload = { data: [{ id: 900, periode: '2026/2027', pengumuman_published: false }] };
    else if (url.pathname.endsWith('/assignments')) payload = { data: { reviewers: people, assigned_ids: [...assigned] } };
    else if (url.pathname.includes('/assignments/')) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (failAssignment) { responseCode = 503; payload = { message: 'Penugasan gagal. Coba lagi.' }; }
      else { const id = Number(url.pathname.split('/').at(-1)); if (request.method === 'DELETE') assigned.delete(id); else assigned.add(id); responseCode = 204; }
    } else if (url.pathname.endsWith('/review')) {
      await new Promise((resolve) => setTimeout(resolve, 180));
      if (failSave) { responseCode = 503; payload = { message: 'Nilai gagal disimpan. Coba lagi.' }; }
      else {
        const id = Number(url.pathname.split('/').at(-2)); const row = rows.find((item) => item.registration_id === id); const { field, value } = JSON.parse(request.postData);
        if (field === 'comment') row.review.comment = value; else row.review.scores[field] = value === null ? null : Number(String(value).replace(',', '.'));
        row.review.total = criteria.some((key) => row.review.scores[key] === null) ? null : criteria.reduce((sum, key) => sum + row.review.scores[key], 0) / 60 * 100;
        row.average = row.review.total; row.reviews = [row.review];
        payload = { data: row.review, summary: { average: row.average, reviews: row.reviews, reviews_hidden: false } };
      }
    } else if (/\/assessment\/\d+$/.test(url.pathname)) {
      const id = Number(url.pathname.split('/').at(-1));
      await new Promise((resolve) => setTimeout(resolve, id === 1 ? 250 : 30));
      payload = { data: { id, questions: [{ id: 'q1', label: 'Bagaimana kamu menyelesaikan perbedaan pendapat dalam tim?' }, { id: 'q2', label: 'Ceritakan pengalaman organisasi kamu.' }], answers: { q1: `Jawaban peserta ${id}: Mendengarkan setiap pendapat dan menyepakati langkah bersama.`, q2: 'Saya menjadi bagian dari tim kegiatan kampus.' }, files: {} } };
    } else if (url.pathname.endsWith('/assessment')) {
      latestQuery = url.search;
      const review = url.searchParams.get('review'); const decision = url.searchParams.get('decision'); const search = (url.searchParams.get('search') || '').toLowerCase();
      const filtered = rows.filter((row) => (review === 'complete' ? row.review.total !== null : review === 'incomplete' ? row.review.total === null : true) && (!decision || decision === 'all' || row.decision.status === decision) && `${row.name} ${row.nim}`.toLowerCase().includes(search));
      payload = { data: filtered, total: filtered.length, current_page: 1, last_page: 1, per_page: 20, form_fields: [{ name: 'alasan', label: 'Alasan mendaftar', type: 'textarea', target_type: 'all' }], period: { id: 900, periode: '2026/2027', locked: false }, is_reviewer: role !== 'admin', can_review: role !== 'admin', can_decide: role === 'super_admin' };
    } else payload = { data: null };
    await send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: [
      { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
      { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'accept,content-type,x-requested-with,x-xsrf-token' },
      { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
    ], body: responseCode === 204 ? '' : Buffer.from(JSON.stringify(payload)).toString('base64') });
  }
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.id) { const callback = callbacks.get(event.id); callbacks.delete(event.id); if (event.error) callback?.reject(new Error(event.error.message)); else callback?.resolve(event.result); }
    else if (event.method === 'Fetch.requestPaused') intercept(event.params).catch((error) => errors.push(error.message));
    else if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
  });
  async function evaluate(expression) { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
  async function waitFor(expression) { for (let i = 0; i < 120; i++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise((resolve) => setTimeout(resolve, 100)); } throw new Error('Not found: ' + expression); }
  const click = (text) => evaluate(`{const el=Array.from(document.querySelectorAll('button')).find(el=>el.textContent.trim()===${JSON.stringify(text)});el?.focus();el?.click();}`);
  const setInput = async (selector, value, blur = false) => {
    await evaluate(`{const el=document.querySelector(${JSON.stringify(selector)});el.focus();el.select();}`);
    await send('Input.insertText', { text: value });
    if (blur) await evaluate(`document.querySelector(${JSON.stringify(selector)}).blur()`);
  };
  async function screenshot(name) { const result = await send('Page.captureScreenshot', { format: 'png' }); const dir = path.join('.next', 'assessment-checks'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name + '.png'), Buffer.from(result.data, 'base64')); }
  const score = 'input[aria-label="Pemahaman untuk Nadia Putri"]';
  try {
    await send('Runtime.enable'); await send('Page.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: '*api/*' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:3000/admin/oprec/penilaian' });
    await waitFor(`document.querySelectorAll('.assessment-table tbody tr').length===3`);
    assert.equal(await evaluate(`document.querySelectorAll('.assessment-band').length`), 5);
    await screenshot('desktop');
    await evaluate(`document.querySelectorAll('.assessment-row--selectable')[0].querySelectorAll('td')[1].click()`);
    await waitFor(`document.querySelectorAll('.assessment-row--selected').length===1 && document.querySelector('.assessment-answer__body')?.textContent.includes('Jawaban peserta 1')`);
    assert.equal(await evaluate(`document.querySelector('.assessment-row--selected .assessment-participant-name').textContent`), 'Nadia Putri');
    await evaluate(`document.querySelectorAll('.assessment-row--selectable')[1].querySelectorAll('td')[1].click()`);
    await waitFor(`document.querySelector('.assessment-row--selected .assessment-participant-name')?.textContent==='Raka Aditya' && document.querySelector('.assessment-answer__body')?.textContent.includes('Jawaban peserta 2')`);
    await evaluate(`document.querySelector('button[aria-label="Tutup jawaban"]').click()`);
    await evaluate(`document.querySelector('input[aria-label="Pemahaman untuk Nadia Putri"]').click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.assessment-row--selected').length`), 0);
    for (const width of [320, 390, 768, 1280, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth`), false, `Page overflow at ${width}`);
    }
    await setInput(score, '7,5', true); await waitFor(`document.querySelector(${JSON.stringify(score)}).value==='7,5' && document.querySelector('.assessment-save--saved')`);
    assert.equal(rows[0].review.scores.pemahaman, 7.5);
    failSave = true; await setInput(score, '9', true); await waitFor(`document.querySelector('.assessment-save--error button')`);
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(score)}).value`), '9');
    failSave = false; await evaluate(`document.querySelector('.assessment-save--error button').click()`); await waitFor(`document.querySelector('.assessment-save--saved') && !document.querySelector('.assessment-save--saving')`);
    assert.equal(rows[0].review.scores.pemahaman, 9);
    await setInput(score, '6', true); await setInput(score, '8', true); await setInput(score, '6', true);
    await waitFor(`document.querySelector(${JSON.stringify(score)}).value==='6' && document.querySelector('.assessment-save--saving')===null`);
    assert.equal(rows[0].review.scores.pemahaman, 6);
    await click('Tugaskan penilai'); await waitFor(`document.querySelectorAll('.assessment-reviewer').length===2`);
    await screenshot('assignment'); failAssignment = true; await click('Tugaskan'); await waitFor(`document.querySelector('.assessment-reviewer__error')`);
    assert.equal(assigned.has(52), false); failAssignment = false; await click('Tugaskan'); await waitFor(`document.querySelectorAll('.assessment-reviewer.is-assigned').length===2`);
    await click('Cabut akses'); await waitFor(`document.querySelector('.assessment-revoke')`); await click('Batal'); assert.equal(assigned.size, 2);
    await click('Cabut akses'); await click('Ya, cabut akses'); await waitFor(`document.querySelectorAll('.assessment-reviewer.is-assigned').length===1`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await waitFor(`!document.querySelector('.assessment-assignment-dialog')`);
    assert.equal(await evaluate(`document.activeElement?.textContent.trim()`), 'Tugaskan penilai');
    await evaluate(`document.querySelector('button[aria-label="Lihat jawaban Tes Tulis Nadia Putri"]').click();document.querySelector('button[aria-label="Lihat jawaban Tes Tulis Raka Aditya"]').click();`);
    await waitFor(`document.querySelector('.assessment-answer__body')?.textContent.includes('Jawaban peserta 2')`);
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert.equal(await evaluate(`document.querySelector('.assessment-answer__body').textContent.includes('Jawaban peserta 1')`), false);
    await evaluate(`document.querySelector('button[aria-label="Tutup jawaban"]').click()`);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await waitFor(`matchMedia('(max-width:1279px)').matches`);
    await evaluate(`document.querySelector('button[aria-label="Lihat jawaban Tes Tulis Nadia Putri"]').click()`);
    await waitFor(`document.querySelector('.assessment-answer-dialog')?.open`);
    await waitFor(`document.querySelector('.assessment-answer-dialog').textContent.includes('Jawaban peserta 1')`);
    assert.equal(await evaluate(`Math.round(document.querySelector('.assessment-answer-dialog').getBoundingClientRect().width)`), 390);
    await screenshot('mobile-answer'); await click('Kembali ke tabel');
    assert.equal(await evaluate(`document.activeElement?.getAttribute('aria-label')`), 'Lihat jawaban Tes Tulis Nadia Putri');
    await screenshot('mobile-table');
    await evaluate(`{const el=Array.from(document.querySelectorAll('select')).find(el=>el.parentElement.textContent.includes('Penilaian saya'));el.value='complete';el.dispatchEvent(new Event('change',{bubbles:true}));}`);
    await waitFor(`document.body.innerText.includes('Peserta tidak ditemukan')`); assert.ok(latestQuery.includes('review=complete'));
    await click('Reset pencarian & filter'); await waitFor(`document.querySelectorAll('.assessment-table tbody tr').length===3`);
    role = 'admin'; await send('Page.reload'); await waitFor(`document.querySelectorAll('.assessment-table tbody tr').length===3 && document.body.innerText.includes('Mode hanya baca')`);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).some(el=>el.textContent.trim()==='Tugaskan penilai')`), false);
    assert.equal(await evaluate(`document.querySelectorAll('.assessment-score:not(:disabled)').length`), 0);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('.assessment-toolbar label')).some(el=>el.textContent.includes('Penilaian saya'))`), false);
    assert.deepEqual(errors, []);
    console.log('PASS: 320/390/768/1280/1440px, legend, rapid autosave, save retry, assignment/revoke/cancel/retry, Escape/focus, stale answers, fullscreen mobile answers, server-filter query, read-only Admin. API fixtures only.');
  } finally { socket.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
