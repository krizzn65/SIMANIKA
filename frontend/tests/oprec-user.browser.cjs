// Production Next proxy + synthetic API + isolated Chrome profile. No real accounts/database.
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const origin = 'http://localhost:3010';
  let role = 'user'; let registered = false; let testSubmitted = false; let released = false;
  let registrationAttempts = 0; let testAttempts = 0; let resultStatus = 'accepted';
  const requests = []; const errors = [];
  const enrollmentOnly = process.argv.includes('--enrollment-only');
  const scheduleOnly = process.argv.includes('--schedule-only');
  const positionsOnly = process.argv.includes('--positions-only');
  const adminFormsOnly = process.argv.includes('--admin-forms-only');
  const summaryOnly = process.argv.includes('--summary-only');
  if (summaryOnly) registered = true;
  let builderSaveAttempts = 0; let editAttempts = 0; let savedEdit;
  let releaseBuilderResponse; let builderResponseGate = Promise.resolve();
  let scheduleLocked = false; let savedSchedule; if (scheduleOnly || positionsOnly || adminFormsOnly) role = 'admin';
  let releaseProfile; let enrollmentAttempts = 0;
  const profileGate = enrollmentOnly ? new Promise(resolve => { releaseProfile = resolve; }) : Promise.resolve();
  const period = { id: 900, periode: '2026/2027', status: 'open', headline: 'OPREC Uji', schemaVersion: '1',
    tanggalBuka: '2000-01-01T00:00:00+07:00', tanggalTutup: '2099-01-01T00:00:00+07:00',
    divisiTersedia: (positionsOnly ? ['BPH', 'Humas', 'PSDM', 'Kominfo', 'KWU', 'Ristek'] : ['Humas', 'PSDM', 'Kominfo']).map((nama, i) => ({ id: i + 1, nama,
      jabatan: positionsOnly ? (nama === 'BPH' ? ['Ketua Umum', 'Sekretaris 1', 'Bendahara 1'] : ['Ketua Divisi ' + nama, 'Staff Bidang Lama']) : ['Staff Divisi ' + nama] })),
    formFields: [{ name: 'nama', label: 'Nama', type: 'text', required: true }, { name: 'nim', label: 'NIM', type: 'text', required: true },
      { name: 'tanggal_lahir', label: 'Tanggal lahir', type: 'date', required: true },
      { name: 'angkatan', label: 'Angkatan', type: 'select', required: true, options: [{ value: '2024', label: '2024' }] },
      { name: 'cv', label: 'CV', type: 'file', required: false, accept: ['.pdf'], maxSizeMB: 2 }],
    pengumuman: { published: false }, faq: [] };
  if (summaryOnly) period.formFields.splice(4, 0,
    { name: 'golongan', label: 'Golongan', type: 'select', required: true, options: ['A', 'B', 'C', 'D', 'E'].map(value => ({ value, label: value })) },
    { name: 'nomor_wa', label: 'Nomor WA', type: 'tel', required: true },
    { name: 'ktm_sim_online', label: 'Upload KTM/SIM Online', type: 'file', required: true, accept: ['.pdf'], maxSizeMB: 5 },
    { name: 'surat_pernyataan', label: 'Upload Surat Pernyataan', type: 'file', required: true, accept: ['.pdf'], maxSizeMB: 5 });
  const registration = () => registered ? { id: 100, nim: 'E3124001', tanggalLahir: '2004-01-01',
    divisiPilihan1: 1, divisiPilihan2: 2, divisiPilihan3: 3, status: released ? resultStatus : 'pending',
    formData: { nama: 'Peserta Uji', angkatan: '2024', ...(summaryOnly ? { golongan: 'A', nomor_wa: '08123456789', jabatan_pilihan_1: 'Staff Divisi Humas' } : {}) },
    uploadedFileFields: summaryOnly ? ['ktm_sim_online', 'surat_pernyataan'] : [], registeredAt: new Date().toISOString() } : null;
  const backend = http.createServer(async (req, res) => {
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks); let payload = {}; let status = 200;
      if (req.url === '/api/public/oprec') payload = { data: period };
      else if (req.url === '/api/user/oprec/register') {
        const form = await new Request('http://fixture.test', { method: 'POST', headers: req.headers, body }).formData();
        assert.equal(form.get('nim'), 'E3124001');
        assert.deepEqual([1, 2, 3].map(rank => form.get('divisi_pilihan_' + rank)), ['1', '2', '3']);
        assert.equal(form.get('jabatan_pilihan_1'), 'Staff Divisi Humas');
        assert.equal(form.get('cv').name, 'cv.pdf');
        registrationAttempts++;
        if (registrationAttempts === 1) { status = 503; payload = { message: 'Temporary failure' }; }
        else { registered = true; status = 201; payload = { data: { submitted: true } }; }
      } else if (req.url.endsWith('/announcement/verify')) {
        const input = JSON.parse(body);
        if (!released) { status = 409; }
        else if (input.nim !== 'E3124001' || input.tanggal_lahir !== '2004-01-01') { status = 404; }
        else payload = { ticket: 'synthetic-private-ticket', expires_in: 1800 };
      } else if (req.url.endsWith('/announcement/result')) {
        assert.equal(JSON.parse(body).ticket, 'synthetic-private-ticket');
        payload = { data: { status: resultStatus, period: period.periode, name: 'Peserta Uji', nim: 'E3124001',
          division: 'Humas', position: 'Staff Bidang Internal', whatsapp_url: resultStatus === 'accepted' ? 'https://chat.whatsapp.com/SyntheticInvite' : null } };
      } else status = 404;
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload));
    } catch (error) { errors.push(error.message); res.writeHead(500); res.end('{}'); }
  });
  await new Promise(resolve => backend.listen(19092, '127.0.0.1', resolve));
  const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3010'], {
    env: { ...process.env, API_BASE_URL: 'http://127.0.0.1:19092/api' }, stdio: ['ignore', 'ignore', 'pipe'] });
  next.stderr.on('data', data => process.stderr.write(data));
  const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profile = path.resolve('.next', 'oprec-user-browser-' + process.pid);
  const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=19442', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  let socket;
  try {
    let targets;
    for (let i = 0; i < 100; i++) {
      try { targets = await fetch('http://127.0.0.1:19442/json').then(r => r.json()); if ((await fetch(origin + '/login')).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(targets?.some(t => t.type === 'page'), 'Isolated Chrome must be ready');
    socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    const pending = new Map(); let sequence = 0;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(Error(method)); }, 15000);
      pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
    async function intercept({ request, requestId }) {
      const url = new URL(request.url); requests.push(url.pathname);
      if (url.origin === origin && url.pathname.startsWith('/api/oprec/')) return send('Fetch.continueRequest', { requestId });
      let payload = {}; let status = 200;
      if (request.method === 'OPTIONS') payload = {};
      else if (url.pathname.endsWith('/auth/me')) {
        await profileGate;
        if (role === 'expired') { status = 401; payload = { message: 'Unauthenticated' }; }
        else payload = { data: { id: 50, name: 'Peserta Uji', role } };
      }
      else if (url.pathname.includes('/admin/oprec/') && url.pathname.endsWith('/written-test') && scheduleOnly) {
        const stage = { id: 901, headline: 'Tes Jadwal', published: scheduleLocked, submissions_count: scheduleLocked ? 1 : 0,
          tanggal_buka: scheduleLocked ? '2000-01-01T00:00:00Z' : '2099-10-02T00:00:00Z',
          tanggal_tutup: scheduleLocked ? '2000-01-01T01:00:00Z' : '2099-10-02T01:00:00Z',
          questions: [{ id: 'reason', label: 'Alasan bergabung', type: 'paragraph', required: true, targetDivisions: [], options: [] }] };
        if (request.method === 'PUT') { savedSchedule = JSON.parse(request.postData); payload = { data: { ...stage, ...savedSchedule, published: true } }; }
        else payload = { data: { oprec: period, test: stage, divisions: period.divisiTersedia } };
      }
      else if (url.pathname.endsWith('/user/oprec/enroll')) {
        assert.equal(Number(JSON.parse(request.postData).oprec_id), 900); enrollmentAttempts++; payload = { data: { enrolled: true } };
      }
      else if (url.pathname.endsWith('/user/dashboard')) payload = { data: { items: [] } };
      else if (url.pathname.endsWith('/user/oprec/workspace')) payload = { data: { oprec: period, enrolled: true, registration: registration(), announced: released } };
      else if (url.pathname.endsWith('/written-test') && request.method === 'GET') payload = { data: {
        id: 901, headline: 'Tes Uji', ready: true, active: true, server_now: new Date().toISOString(),
        tanggal_buka: '2000-01-01T00:00:00Z', tanggal_tutup: '2099-01-01T00:00:00Z',
        questions: [{ id: 'reason', type: 'short_text', label: 'Alasan bergabung', required: true }],
        submission: testSubmitted ? { answers: { reason: 'Ingin berkontribusi' }, files: {}, submitted_at: new Date().toISOString() } : null } };
      else if (url.pathname.endsWith('/written-test') && request.method === 'POST') {
        testAttempts++; assert.equal(JSON.parse(request.postData).answers.reason, 'Ingin berkontribusi');
        if (testAttempts === 1) { status = 503; payload = { message: 'Jawaban gagal disimpan. Coba lagi.' }; }
        else { testSubmitted = true; status = 201; payload = { data: { submitted: true } }; }
      } else if (adminFormsOnly && url.pathname.endsWith('/admin/oprec/900')) {
        if (request.method === 'PUT') {
          builderSaveAttempts++;
          const input = JSON.parse(request.postData);
          assert.equal(input.periode, period.periode);
          assert.deepEqual(input.form_fields.slice(4, 8).map(field => field.name), ['golongan', 'nomor_wa', 'ktm_sim_online', 'surat_pernyataan']);
          assert.deepEqual(input.form_fields[4].options.map(option => option.value), ['X', 'Y']);
          assert.deepEqual(input.divisi_tersedia.map(d => d.jabatan), period.divisiTersedia.map(d => d.jabatan));
          await builderResponseGate;
          if (builderSaveAttempts === 1) { status = 503; payload = { message: 'Penyimpanan builder gagal sementara.' }; }
          else payload = { data: period };
        } else payload = { data: period };
      } else if (adminFormsOnly && url.pathname.endsWith('/registrants')) payload = { data: [{
        id: 100, name: 'Peserta Uji', nim: 'E3124001', tanggalLahir: '2004-01-01',
        divisiPilihan1: 1, divisiPilihan2: 2, divisiPilihan3: 3,
        formData: { nama: 'Peserta Uji', angkatan: '2024' }, fileUploads: {},
      }], current_page: 1, last_page: 1, total: 1, per_page: 20 };
      else if (adminFormsOnly && url.pathname.endsWith('/registrants/100/form') && request.method === 'PUT') {
        editAttempts++; savedEdit = JSON.parse(request.postData);
        assert.equal(savedEdit.nim, 'E3124001'); assert.equal(savedEdit.tanggal_lahir, '2004-01-01');
        assert.equal(savedEdit.schema_version, '1'); assert.equal(savedEdit.status, undefined);
        if (editAttempts === 1) { status = 503; payload = { message: 'Koreksi gagal sementara.' }; }
        else payload = { data: { nim: savedEdit.nim, tanggalLahir: savedEdit.tanggal_lahir } };
      } else if (positionsOnly && url.pathname.endsWith('/admin/oprec/900')) payload = { data: period };
      else if (url.pathname.endsWith('/admin/oprec')) payload = { data: [period] };
      else if (url.pathname.endsWith('/admin/oprec/written-tests')) payload = { data: [{ ...period, written_test: {
        id: 901, headline: 'Tes Uji', published: true, tanggal_buka: period.tanggalBuka, tanggal_tutup: period.tanggalTutup, submissions_count: 1 } }], eligible_periods: [], last_page: 1 };
      else { status = 404; }
      await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'accept,content-type,x-requested-with,x-xsrf-token' },
        { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
      ], body: Buffer.from(JSON.stringify(payload)).toString('base64') });
    }
    socket.addEventListener('message', ({ data }) => {
      const event = JSON.parse(data);
      if (event.id) { const cb = pending.get(event.id); pending.delete(event.id); if (event.error) cb?.reject(Error(event.error.message)); else cb?.resolve(event.result); }
      else if (event.method === 'Runtime.exceptionThrown') errors.push(event.params.exceptionDetails.text);
      else if (event.method === 'Fetch.requestPaused') intercept(event.params).catch(error => errors.push(error.message));
    });
    const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
    const waitFor = async expression => { for (let i = 0; i < 150; i++) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw Error('Missing: ' + expression + '; page: ' + await evaluate('document.body?.innerText.slice(-1400)') + '; errors: ' + errors.join(',') + '; paths: ' + requests.slice(-12).join(',')); };
    const click = text => evaluate(`Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === ${JSON.stringify(text)})?.click()`);
    const fill = async (selector, value) => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`); await send('Input.insertText', { text: value }); };
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Fetch.enable', { patterns: [{ urlPattern: '*api/*' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    if (summaryOnly) {
      await send('Page.navigate', { url: origin + '/dashboard/oprec' });
      await waitFor(`document.body?.innerText.includes('Data & administrasi') && document.body?.innerText.includes('Divisi Pilihan 1')`);
      const summary = await evaluate(`{
        const section = Array.from(document.querySelectorAll('section')).find(el => el.querySelector('h2')?.textContent.trim() === 'Data & administrasi');
        Array.from(section.querySelectorAll('dl dt')).map(dt => ({ label: dt.textContent.trim(), value: dt.nextElementSibling?.textContent.trim() }));
      }`);
      assert.deepEqual(summary.slice(0, 2).map(row => row.label), ['Nama lengkap', 'NIM']);
      assert.deepEqual(summary.slice(3, 8).map(row => row.label), ['Angkatan', 'Golongan', 'Nomor WA', 'Upload KTM/SIM Online', 'Upload Surat Pernyataan']);
      assert.equal(summary.find(row => row.label === 'Upload Surat Pernyataan')?.value, 'Berkas diunggah');
      assert.equal(summary.find(row => row.label === 'Divisi Pilihan 1')?.value, 'Humas (Staff Divisi Humas)');
      assert.equal(summary.some(row => row.label.startsWith('Jabatan Pilihan')), false);
      for (const width of [320, 390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'participant summary width ' + width);
      }
      assert.deepEqual(errors, []);
      console.log('PASS: participant summary identity order, division position, and 4 viewports.');
      return;
    }
    if (adminFormsOnly) {
      const waitForFixture = async condition => {
        for (let i = 0; i < 100; i++) {
          if (condition()) return;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        throw Error('Fixture request was not received');
      };
      const setInput = (selector, value) => evaluate(`{
        const input = document.querySelector(${JSON.stringify(selector)});
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }`);
      await send('Page.navigate', { url: origin + '/admin/oprec/900/edit' });
      await waitFor(`document.querySelector('.oprec-builder__tabs')`);
      await evaluate(`Array.from(document.querySelectorAll('.oprec-builder__tabs button')).find(button => button.textContent.includes('Pertanyaan Formulir')).click()`);
      await waitFor(`Array.from(document.querySelectorAll('.oprec-builder__field--fixed')).some(card => card.querySelector('strong')?.textContent === 'Golongan')`);
      assert.equal(await evaluate(`Array.from(document.querySelectorAll('.oprec-builder__field--fixed')).find(card => card.querySelector('strong')?.textContent === 'Golongan').querySelector('textarea').value`), 'A\nB\nC\nD\nE');
      await evaluate(`{
        const textarea = Array.from(document.querySelectorAll('.oprec-builder__field--fixed')).find(card => card.querySelector('strong')?.textContent === 'Golongan').querySelector('textarea');
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(textarea, ${JSON.stringify('X\nY')});
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }`);
      builderResponseGate = new Promise(resolve => { releaseBuilderResponse = resolve; });
      await evaluate(`{
        const buttons = Array.from(document.querySelectorAll('button')).filter(el => el.textContent.trim() === 'Simpan Formulir');
        for (let i = 0; i < 3; i++) for (const button of buttons) button.click();
      }`);
      await waitForFixture(() => builderSaveAttempts === 1);
      await waitFor(`document.querySelector('.oprec-builder__hero-actions .oprec-btn--primary')?.disabled`);
      await evaluate(`document.querySelector('.oprec-builder__hero-actions .oprec-btn--primary').click()`);
      releaseBuilderResponse();
      await waitFor(`document.body.innerText.includes('belum tersimpan') && !document.querySelector('.oprec-builder__hero-actions .oprec-btn--primary').disabled`);
      assert.equal(builderSaveAttempts, 1, 'one request while the builder save is pending');
      builderResponseGate = Promise.resolve();
      await click('Simpan Formulir'); await waitForFixture(() => builderSaveAttempts === 2);
      await waitFor(`!document.querySelector('.oprec-builder__hero-actions .oprec-btn--primary').disabled`);

      await send('Page.navigate', { url: origin + '/admin/oprec' });
      await waitFor(`document.querySelector('.oprec-table-btn--edit')`); await click('Edit');
      await waitFor(`document.querySelector('#oprec-registrant-nim')`);
      await setInput('#oprec-registrant-nim', 'A3124001'); await click('Simpan perubahan');
      await waitFor(`document.querySelector('#oprec-registrant-nim-error')`);
      assert.equal(await evaluate(`document.activeElement.id`), 'oprec-registrant-nim');
      assert.equal(await evaluate(`document.querySelector('#oprec-registrant-nim').getAttribute('aria-invalid')`), 'true');
      assert.equal(editAttempts, 0);
      await setInput('#oprec-registrant-nim', ' e3124001 ');
      for (const invalidDate of ['', '1899-12-31', '2099-01-01']) {
        await setInput('#oprec-registrant-birth-date', invalidDate); await click('Simpan perubahan');
        await waitFor(`document.querySelector('#oprec-registrant-birth-date-error')`);
        assert.equal(await evaluate(`document.activeElement.id`), 'oprec-registrant-birth-date');
        assert.equal(editAttempts, 0, 'invalid identity must not call the correction API');
      }
      for (const width of [320, 390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'admin correction width ' + width);
      }
      await setInput('#oprec-registrant-birth-date', '2004-01-01'); await click('Simpan perubahan');
      await waitFor(`document.body.innerText.includes('Koreksi gagal sementara.')`);
      assert.equal(editAttempts, 1); assert.equal(savedEdit.nim, 'E3124001');
      assert.equal(await evaluate(`document.querySelector('#oprec-registrant-birth-date').value`), '2004-01-01');
      await click('Simpan perubahan'); await waitForFixture(() => editAttempts === 2);
      await waitFor(`document.querySelector('#oprec-registrant-nim').value === 'E3124001'`);
      assert.deepEqual(errors, []);
      console.log('PASS: builder repeated clicks/delayed request/failure/retry; Admin inline identity validation, no invalid requests, normalization, correction failure/retry; 4 viewports.');
      return;
    }
    if (positionsOnly) {
      await send('Page.navigate', { url: origin + '/admin/oprec/900/edit' });
      await waitFor(`document.querySelector('.oprec-builder__tabs')`);
      await evaluate(`Array.from(document.querySelectorAll('button')).find(el=>el.textContent.includes('2. Kelola Divisi'))?.click()`);
      await waitFor(`document.querySelectorAll('.oprec-builder__jabatan-section').length === 6`);
      const expected = [['Wakil Ketua Umum','Sekretaris 2','Bendahara 2'], ...['Humas','PSDM','Kominfo','KWU','Ristek'].map(name=>['Staff Divisi '+name])];
      assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.oprec-builder__jabatan-section')).map(el=>Array.from(el.querySelectorAll('.oprec-builder__jabatan-chip-text')).map(chip=>chip.textContent))`), expected);
      assert.equal(await evaluate(`Boolean(document.querySelector('.oprec-builder__jabatan-input,.oprec-builder__jabatan-chip-del,.oprec-builder__jabatan-add-btn'))`), false);
      assert.equal(await evaluate(`document.body.innerText.includes('Reset Default')`), false);
      for(const width of [320,390,768,1440]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'fixed catalog editor width '+width);
      }
      await click('Form Pendaftaran');
      await waitFor(`document.querySelectorAll('.oprec-user-preview .oprec-division-choice').length === 6`);
      const expectedLogos = ['bph', 'humas', 'psdm', 'kominfo', 'kwu'].map(name => '/images/divisi/' + name + '.webp').concat(null);
      assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.oprec-user-preview .oprec-division-choice')).map(el => el.querySelector('img')?.getAttribute('src') || null)`), expectedLogos);
      for(const index of [0,1,2]) await evaluate(`document.querySelectorAll('.oprec-user-preview .oprec-division-choice')[${index}].click()`);
      await waitFor(`document.querySelectorAll('.oprec-user-preview .oprec-jabatan-slot__select').length === 3`);
      assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.oprec-user-preview .oprec-jabatan-slot__select')).map(el=>Array.from(el.options).map(option=>option.value).filter(Boolean))`),expected.slice(0,3));
      role = 'user'; await send('Page.navigate',{url:origin+'/dashboard/oprec'});
      await waitFor(`document.querySelector('.event-dynamic-form')`);
      assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.event-dynamic-form .oprec-division-choice')).map(el => el.querySelector('img')?.getAttribute('src') || null)`), expectedLogos);
      for(const id of [1,2,3]) await evaluate(`document.querySelector('#oprec-divisi-'+${id}).click()`);
      await waitFor(`document.querySelector('#oprec-jabatan-select-1')?.options.length === 4`);
      assert.deepEqual(await evaluate(`Array.from(document.querySelector('#oprec-jabatan-select-1').options).map(option=>option.value).filter(Boolean)`),expected[0]);
      assert.equal(await evaluate(`document.querySelector('#oprec-jabatan-select-2').value`),'Staff Divisi Humas');
      assert.equal(await evaluate(`document.querySelector('#oprec-jabatan-select-3').value`),'Staff Divisi PSDM');
      for(const width of [320,390,768,1440]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false});
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'),false,'fixed catalog participant width '+width);
      }
      assert.deepEqual(errors,[]); console.log('PASS: fixed registration catalogs in Admin editor, preview, and participant form; shared default logos and fallback; no custom-position controls; 4 viewports.'); return;
    }
    if (scheduleOnly) {
      await send('Page.navigate', { url: origin + '/admin/oprec/test/900/edit' });
      await waitFor(`document.querySelectorAll('.oprec-test__editor-panel input[type=datetime-local]').length === 2`);
      assert.equal(await evaluate(`document.querySelector('.oprec-test__editor-panel input[type=datetime-local]').value`), '2099-10-02T07:00');
      for(const width of [320,390,768,1440]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'),false,'schedule editor width '+width);}
      await evaluate(`{const inputs=document.querySelectorAll('.oprec-test__editor-panel input[type=datetime-local]');for(const [index,value] of ['2099-10-02T08:00','2099-10-02T09:00'].entries()){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[index],value);inputs[index].dispatchEvent(new Event('input',{bubbles:true}));inputs[index].dispatchEvent(new Event('change',{bubbles:true}));}}`);
      await click('Simpan pertanyaan'); await waitFor(`document.body?.innerText.toLowerCase().includes('soal siap')`);
      assert.equal(Date.parse(savedSchedule.tanggal_buka), Date.parse('2099-10-02T01:00:00Z'));
      assert.equal(Date.parse(savedSchedule.tanggal_tutup), Date.parse('2099-10-02T02:00:00Z'));
      scheduleLocked = true; await send('Page.reload');
      await waitFor(`document.body?.innerText.includes('Jadwal dan soal terkunci')`);
      assert.equal(await evaluate(`Array.from(document.querySelectorAll('.oprec-test__editor-panel input')).every(input=>input.disabled || input.closest('fieldset')?.disabled)`), true);
      assert.equal(await evaluate(`document.querySelector('.oprec-test__footer button').disabled`), true);
      assert.deepEqual(errors, []); console.log('PASS: schedule edited through UI in WIB, saved as the correct instant, and locked with questions after the test starts.'); return;
    }
    if (enrollmentOnly) {
      await send('Page.navigate', { url: origin + '/oprec' });
      await waitFor(`Array.from(document.querySelectorAll('button')).some(el => el.textContent.includes('Lihat detail'))`);
      await waitFor(`(() => { if (!document.querySelector('.oprec-modal-cta-btn')) Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === 'Lihat detail')?.click(); return !!document.querySelector('.oprec-modal-cta-btn'); })()`);
      await waitFor(`document.querySelector('.oprec-modal-cta-btn')?.disabled && document.body?.innerText.includes('Memeriksa sesi')`);
      await evaluate(`document.querySelector('.oprec-modal-cta-btn').click()`);
      assert.equal(await evaluate('location.pathname'), '/oprec'); assert.equal(enrollmentAttempts, 0);
      releaseProfile();
      await waitFor(`document.querySelector('.oprec-modal-cta-btn')?.textContent.includes('Daftar Sekarang') && !document.querySelector('.oprec-modal-cta-btn').disabled`);
      await click('Daftar Sekarang'); await waitFor(`location.pathname === '/dashboard'`);
      assert.equal(enrollmentAttempts, 1); assert.deepEqual(errors, []);
      console.log('PASS: enrollment waits for the session check, prevents premature login redirect, and enrolls exactly once.');
      return;
    }
    await send('Page.navigate', { url: origin + '/dashboard/oprec' });
    await waitFor(`document.querySelector('.event-dynamic-form')`);
    for (const width of [320, 390, 768, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'participant width ' + width);
    }
    await fill('[name="nama"]', 'Peserta Uji'); await fill('[name="nim"]', 'e3124001');
    assert.equal(await evaluate(`document.querySelector('[name="nim"]').value`), 'E3124001');
    await evaluate(`{ const el=document.querySelector('[name="tanggal_lahir"]');el.value='2004-01-01';el.dispatchEvent(new Event('input',{bubbles:true})); const select=document.querySelector('[name="angkatan"]');select.value='2024';select.dispatchEvent(new Event('change',{bubbles:true})); }`);
    const pdf = path.resolve('.next', 'oprec-user-fixtures', 'cv.pdf');
    fs.mkdirSync(path.dirname(pdf), { recursive: true }); fs.writeFileSync(pdf, '%PDF-1.4\nSynthetic test CV\n%%EOF');
    const document = await send('DOM.getDocument');
    const input = await send('DOM.querySelector', { nodeId: document.root.nodeId, selector: '[name="cv"]' });
    await send('DOM.setFileInputFiles', { nodeId: input.nodeId, files: [pdf] });
    await evaluate(`document.querySelector('.event-dynamic-form').requestSubmit()`);
    await waitFor(`document.querySelector('.event-form-feedback[role="alert"]')`);
    assert.equal(registrationAttempts, 0);
    for (const id of [1, 2, 3]) await evaluate(`document.querySelector('#oprec-divisi-${id}').click()`);
    await evaluate(`document.querySelector('.event-dynamic-form').requestSubmit()`);
    await waitFor(`document.querySelector('.oprec-submit-dialog')`); await click('Ya, kirim formulir');
    await waitFor(`document.querySelector('.event-form-feedback')?.textContent.includes('belum bisa')`);
    assert.equal(registered, false);
    await evaluate(`document.querySelector('.event-dynamic-form').requestSubmit()`);
    await waitFor(`document.querySelector('.oprec-submit-dialog')`); await click('Ya, kirim formulir');
    await waitFor(`document.body?.innerText.includes('Pendaftaran Berhasil Dikirim') && document.body?.innerText.includes('Kerjakan sekarang')`);
    assert.equal(registrationAttempts, 2);
    assert.equal(await evaluate(`Boolean(document.querySelector('#test-reason'))`), false);
    await click('Kerjakan sekarang');
    await waitFor(`document.querySelector('#test-reason') && !document.body?.innerText.includes('Pendaftaran Berhasil Dikirim')`);
    await fill('#test-reason', 'Ingin berkontribusi'); await click('Kirim jawaban'); await click('Ya, kirim jawaban');
    await waitFor(`document.body?.innerText.includes('Jawaban gagal disimpan')`);
    await click('Kirim jawaban'); await click('Ya, kirim jawaban');
    await waitFor(`document.body?.innerText.includes('Jawaban Tes Tulis Terkirim')`);
    await send('Page.reload'); await waitFor(`document.body?.innerText.includes('Jawaban Tes Tulis Terkirim')`);
    assert.equal(testAttempts, 2);
    released = true;
    const verified = await evaluate(`fetch('/api/oprec/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({oprec_id:900,nim:'e3124001',tanggal_lahir:'2004-01-01'})}).then(r=>r.json())`);
    assert.deepEqual(verified, { verified: true });
    const cookies = (await send('Network.getAllCookies')).cookies;
    const ticket = cookies.find(cookie => cookie.name === 'oprec_result_900');
    assert.ok(ticket?.httpOnly); assert.equal(ticket.path, '/oprec/pengumuman/900');
    await send('Page.navigate', { url: origin + '/oprec/pengumuman/900' });
    await waitFor(`document.body?.innerText.includes('Selamat, kamu diterima!')`);
    assert.ok(await evaluate(`document.querySelector('a[href="https://chat.whatsapp.com/SyntheticInvite"]') !== null`));
    resultStatus = 'rejected'; await send('Page.reload'); await waitFor(`document.body?.innerText.includes('Terima kasih atas perjuanganmu.')`);
    assert.equal(await evaluate(`document.querySelector('a[href*="chat.whatsapp.com"]')`), null);
    role = 'expired'; await send('Page.navigate', { url: origin + '/dashboard/oprec' });
    await waitFor(`location.pathname === '/login'`);
    role = 'leader'; requests.length = 0;
    for (const route of ['/admin/oprec', '/admin/oprec/test']) {
      await send('Page.navigate', { url: origin + route }); await waitFor(`document.body?.innerText.includes('Mode hanya baca')`);
      assert.equal(await evaluate(`document.body?.innerText.includes('Tambah pendaftaran') || document.body?.innerText.includes('Kelola pertanyaan') || document.body?.innerText.includes('Hapus pendaftaran')`), false);
      for (const width of [320, 390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, route + ' width ' + width);
      }
    }
    assert.ok(!requests.some(url => url.includes('/registrants') || url.includes('/submissions')));
    assert.deepEqual(errors, []);
    console.log('PASS: user registration validation/upload/failure/retry, test failure/retry/refresh, result cookie/accepted/rejected, session expiry, leader read-only pages, 4 viewports, no runtime exceptions.');
  } finally {
    socket?.close(); chrome.kill(); next.kill(); await new Promise(resolve => backend.close(resolve));
    // Profile remains an ignored build artifact for diagnostics; never use tracked browser profiles.
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
