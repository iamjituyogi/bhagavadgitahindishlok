/**
 * Verified shlok content for the Daily Shlok card.
 *
 * Only add a shlok here after checking the Sanskrit text against a reliable
 * edition (e.g. Gita Press, Gorakhpur). `hindiMeaning` is optional: leave it
 * as `null` until you have an attributed translation. The card hides the
 * meaning row when it is null. Do not write your own paraphrase here.
 *
 * Sanskrit for 2.47 was checked against holy-bhagavad-gita.org and
 * vedadhara.com, which give identical text.
 */
export type Shlok = {
  chapter: number;
  verse: number;
  sanskrit: string;
  hindiMeaning: string | null;
  /** Shown under the meaning, e.g. "अनुवाद: गीता प्रेस, गोरखपुर". */
  meaningSource: string | null;
};

export const SHLOKS: readonly Shlok[] = [
  {
    chapter: 2,
    verse: 47,
    sanskrit:
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    hindiMeaning: null,
    meaningSource: null,
  },
];

/** Picks a shlok deterministically per calendar day. */
export function getShlokForDate(date: Date): Shlok | null {
  if (SHLOKS.length === 0) {
    return null;
  }
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  return SHLOKS[dayOfYear % SHLOKS.length];
}
