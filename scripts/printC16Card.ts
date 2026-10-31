// The C16 card as PDFs (issue 145), A4 and Letter, from a running dev server: `npm run c16-card` while `npm run dev`
// runs. Each must be one page; the A4 one is kept in docs/ for C16 owners to print without opening Limpide.
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:5173/#c16-card';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url);
await page.locator('.c16-bank').first().waitFor();
for (const [format, path] of [['A4', 'docs/c16-card.pdf'], ['Letter', 'test-results/c16-card-letter.pdf']] as const) {
  const margin = { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }; // a printer's own edge, as the page's @page says
  const pdf = await page.pdf({ format, landscape: true, printBackground: true, margin, path });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
  console.log(`${format}: ${path}, ${pages} page${pages === 1 ? '' : 's'}`);
  if (pages !== 1) process.exitCode = 1;
}
await browser.close();
