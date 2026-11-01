// The C16 card as PDFs (issue 145), A4 and Letter, from a running dev server: `npm run c16-card` while `npm run dev`
// runs. Each must be one page; the A4 one is kept in docs/ for C16 owners to print without opening Limpide.
import { chromium } from '@playwright/test';
import { C16_CARD_MARGIN, pdfPages } from './c16CardPdf.ts';

const url = process.argv[2] ?? 'http://localhost:5173/#c16-card';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url);
await page.getByRole('region', { name: /^Bank A: / }).waitFor();
for (const [format, path] of [['A4', 'docs/c16-card.pdf'], ['Letter', 'test-results/c16-card-letter.pdf']] as const) {
  const pdf = await page.pdf({ format, landscape: true, printBackground: true, margin: C16_CARD_MARGIN, path });
  const pages = pdfPages(pdf);
  console.log(`${format}: ${path}, ${pages} page${pages === 1 ? '' : 's'}`);
  if (pages !== 1) process.exitCode = 1;
}
await browser.close();
