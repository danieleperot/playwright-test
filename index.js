const playwright = require("playwright");
const cliProgress = require('cli-progress');
const args = require('minimist')(process.argv.slice(2))
const path = require("path");
const fs = require("fs");

if (!('url' in args)) {
  console.log(`
  One or few required parameters are missing:
  
  --url:    the url to look at

  Optional parameters
  --folder: the output folder. You will find it in output/[folder]. Default: the url you chose, without scheme
  
  `)
  process.exit(1)
}

const url = args.url;
const folder = path.resolve('output', args.folder || url.split('//').pop());

if (!fs.existsSync(path.resolve('output'))) fs.mkdirSync(path.resolve('output'))
if (!fs.existsSync(folder)) fs.mkdirSync(folder)

const generateViewport = async (browser, prefix, { width, height }, multibar) => {
  console.log(`${prefix} - Viewport: ${width} x ${height}`);
  const bar = multibar.create(100, 0)
  const context = await browser.newContext({
    viewport: { width, height, isMobile: true }
  });
  bar.update(12, {filename: `Viewport: ${width} x ${height}` })
  const page = await context.newPage();
  bar.update(25, {filename: `Viewport: ${width} x ${height}` })

  await page.goto(url);
  bar.update(70, {filename: `Viewport: ${width} x ${height}` })

  const imgPath = path.resolve(folder, `${prefix}-${width}_${height}.png`);
  await page.screenshot({
    path: imgPath,
    fullPage: true
  });
  bar.update(100, {filename: `Viewport: ${width} x ${height}` })
  bar.stop()
};

const browserHandle = async name => {
  console.log(`Generazione per il browser: ${name}`);
  const browser = await playwright[name].launch();
  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true
  }, cliProgress.Presets.shades_grey);
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 380, height: 640 }
  ]) {
    await generateViewport(browser, `${name}`, viewport, multibar);
  }
  await browser.close();
};

(async () => {
  for (const browserType of ["chromium", "firefox", "webkit"]) {
    await browserHandle(browserType);
  }
})();
