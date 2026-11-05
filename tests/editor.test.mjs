import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';

let browser, server, origin;
before(async () => {
    server = createServer(async (req, res) => {
        const name = req.url === '/' ? 'index.html' : req.url.slice(1);
        if (!/^[\w-]+\.(?:html|js|css)$/.test(name)) {
            res.writeHead(404).end();
            return;
        }
        try {
            const body = await readFile(new URL(`../${name}`, import.meta.url));
            res.setHeader('Content-Type', name.endsWith('.js') ? 'application/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
            res.end(body);
        } catch { res.writeHead(404).end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
    browser = await puppeteer.launch({ headless: true, args: process.env.CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : [] });
    await browser.defaultBrowserContext().overridePermissions(origin, ['clipboard-read', 'clipboard-write']);
});
after(async () => {
    await browser?.close();
    if (server) await new Promise(resolve => server.close(resolve));
});

async function open(t) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    t.after(async () => { await page.close(); assert.deepEqual(errors, [], 'No runtime exceptions'); });
    await page.goto(origin);
    return page;
}
async function select(page, start, end) {
    await page.$eval('#editor', (editor, [start, end]) => {
        editor.focus();
        editor.setSelectionRange(start, end);
        editor.dispatchEvent(new Event('select'));
    }, [start, end]);
}
const value = page => page.$eval('#editor', editor => editor.value);
async function shortcut(page, key, shift = false) {
    await page.keyboard.down('Control');
    if (shift) await page.keyboard.down('Shift');
    await page.keyboard.press(key);
    if (shift) await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
}

test('startup supports typing, statistics, copying and clearing', async t => {
    const page = await open(t);
    await page.type('#editor', 'Hello world');
    assert.equal(await page.$eval('#preview', e => e.textContent), 'Hello world');
    assert.equal(await page.$eval('#char-count', e => e.textContent), '11');
    assert.equal(await page.$eval('#word-count', e => e.textContent), '2');
    await page.click('#copy-output');
    await page.waitForFunction(() => document.querySelector('#toast').textContent === 'Copied to clipboard.');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Hello world');
    await page.click('#clear-editor');
    assert.equal(await value(page), '');
});

test('formatting, typing and clear have undo/redo transactions', async t => {
    const page = await open(t);
    await page.type('#editor', 'abc');
    await select(page, 0, 3);
    await page.click('#bold-toggle');
    assert.equal(await value(page), '𝐚𝐛𝐜');
    await shortcut(page, 'KeyZ');
    assert.equal(await value(page), 'abc');
    assert.deepEqual(await page.$eval('#editor', e => [e.selectionStart, e.selectionEnd]), [0, 3]);
    await shortcut(page, 'KeyZ', true);
    assert.equal(await value(page), '𝐚𝐛𝐜');
    await page.click('#clear-editor');
    await page.click('#undo');
    assert.equal(await value(page), '𝐚𝐛𝐜');
    await page.click('#redo');
    assert.equal(await value(page), '');
    await page.type('#editor', 'xyz');
    await shortcut(page, 'KeyZ');
    assert.equal(await value(page), '');
    await page.type('#editor', 'new');
    assert.equal(await page.$eval('#redo', e => e.disabled), true);
});

test('list and indent commands respect exclusive line selections', async t => {
    const page = await open(t);
    await page.type('#editor', 'a\nb\nc');
    await select(page, 0, 2);
    await page.click('#apply-list');
    assert.equal(await value(page), '• a\nb\nc');
    await shortcut(page, 'KeyZ');
    await select(page, 0, 2);
    await page.click('#increase-indent');
    assert.equal(await value(page), '  a\nb\nc');
});

test('list cleanup preserves prose and keeps indent before the new marker', async t => {
    const page = await open(t);
    await page.type('#editor', 'Hello. world\n  1. nested');
    await select(page, 0, 24);
    await page.select('#list-select', 'clearList');
    await page.click('#apply-list');
    assert.equal(await value(page), 'Hello. world\n  nested');
    await select(page, 13, 20);
    await page.select('#list-select', 'bullets');
    await page.click('#apply-list');
    assert.equal(await value(page), 'Hello. world\n  • nested');
    await page.click('#decrease-indent');
    assert.equal(await value(page), 'Hello. world\n• nested');
});
