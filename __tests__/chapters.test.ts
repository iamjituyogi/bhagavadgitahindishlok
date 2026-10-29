import { CHAPTERS, getChapterAudioUrl, TOTAL_CHAPTERS } from '../src/data/chapters';
import { getShlokForDate, SHLOKS } from '../src/data/shloks';
import { formatTime, progressRatio } from '../src/utils/time';

describe('getChapterAudioUrl', () => {
  it('maps every chapter 1–18 to the exact smartjpr URL', () => {
    for (let n = 1; n <= 18; n++) {
      expect(getChapterAudioUrl(n)).toBe(`https://mp3.smartjpr.com/Chapter${n}.mp3`);
    }
  });

  it('rejects out-of-range or non-integer chapters', () => {
    expect(() => getChapterAudioUrl(0)).toThrow(RangeError);
    expect(() => getChapterAudioUrl(19)).toThrow(RangeError);
    expect(() => getChapterAudioUrl(1.5)).toThrow(RangeError);
  });
});

describe('CHAPTERS', () => {
  it('has 18 chapters with numbers, ids, titles, artwork and audio in order', () => {
    expect(CHAPTERS).toHaveLength(TOTAL_CHAPTERS);
    CHAPTERS.forEach((c, i) => {
      expect(c.number).toBe(i + 1);
      expect(c.id).toBe(`chapter-${i + 1}`);
      expect(c.titleHindi.length).toBeGreaterThan(0);
      expect(c.image).toBeTruthy();
      expect(c.audioUrl).toBe(getChapterAudioUrl(i + 1));
    });
    expect(new Set(CHAPTERS.map(c => c.image)).size).toBe(TOTAL_CHAPTERS);
  });
});

describe('time utils', () => {
  it('formats mm:ss and h:mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(204)).toBe('03:24');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(NaN)).toBe('00:00');
  });
  it('computes a safe progress ratio', () => {
    expect(progressRatio(30, 60)).toBe(0.5);
    expect(progressRatio(10, 0)).toBe(0);
    expect(progressRatio(90, 60)).toBe(1);
  });
});

describe('daily shlok', () => {
  it('returns a verified shlok deterministically', () => {
    expect(SHLOKS.length).toBeGreaterThan(0);
    const d = new Date(2026, 9, 28);
    expect(getShlokForDate(d)).toBe(getShlokForDate(new Date(d)));
  });
});
