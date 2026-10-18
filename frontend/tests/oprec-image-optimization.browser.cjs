// Run with Node and installed Chrome; checks actual canvas encoding in a browser.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function main() {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/lib/optimizeOprecImage.js'));
  const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/helper.js' ? 'text/javascript' : 'text/html');
    response.end(request.url === '/helper.js' ? source : '<!doctype html><title>OPREC image test</title>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const debugPort = 20000 + process.pid % 10000;
  const profile = path.resolve('.next', `oprec-image-test-${process.pid}`);
  const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, origin,
  ], { stdio: 'ignore' });
  let socket;
  try {
    let page;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        const targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json());
        page = targets.find((target) => target.type === 'page' && target.url === origin + '/');
        if (page) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(page, 'Chrome did not open test page');
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
    const expression = `
      (async () => {
        const { optimizeOprecImage } = await import('/helper.js');
        const small = new File([new Uint8Array(100)], 'small.png', { type: 'image/png' });
        const unchanged = await optimizeOprecImage(small) === small;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1100;
        const context = canvas.getContext('2d');
        const pixels = context.createImageData(1100, 1100);
        for (let i = 0; i < pixels.data.length; i += 4) {
          pixels.data[i] = Math.random() * 256;
          pixels.data[i + 1] = Math.random() * 256;
          pixels.data[i + 2] = Math.random() * 256;
          pixels.data[i + 3] = 255;
        }
        context.putImageData(pixels, 0, 0);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 1));
        const large = new File([blob], 'poster.jpg', { type: 'image/jpeg' });
        const optimized = await optimizeOprecImage(large);
        return { unchanged, inputSize: large.size, outputSize: optimized.size, outputType: optimized.type, outputName: optimized.name };
      })()
    `;
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Browser evaluation timed out')), 90000);
      socket.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        if (message.id !== 1) return;
        clearTimeout(timer);
        if (message.error || message.result?.exceptionDetails) reject(new Error(JSON.stringify(message.error || message.result.exceptionDetails)));
        else resolve(message.result.result.value);
      };
      socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
    });
    assert.equal(result.unchanged, true);
    assert.ok(result.inputSize > 2 * 1024 * 1024 && result.inputSize <= 5 * 1024 * 1024, `Input size ${result.inputSize}`);
    assert.ok(result.outputSize <= 900 * 1024, `Output size ${result.outputSize}`);
    assert.equal(result.outputType, 'image/webp');
    assert.equal(result.outputName, 'poster.webp');
    process.stdout.write(`Poster ${result.inputSize} bytes → ${result.outputSize} bytes WebP; small file unchanged.\n`);
  } finally {
    socket?.close();
    chrome.kill();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
