// The C16 card as a PDF (issue 145), for `npm run c16-card` and the card's spec alike.

/** A printer's own edge, as the card's @page says in the styles. */
export const C16_CARD_MARGIN = { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' };

/** The pages of a PDF, counted in its bytes: the card must be one. */
export const pdfPages = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length;
