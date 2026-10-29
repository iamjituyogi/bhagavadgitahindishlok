import type { ImageSourcePropType } from 'react-native';

export const TOTAL_CHAPTERS = 18;
export const AUDIO_BASE_URL = 'https://mp3.smartjpr.com';

/**
 * Single source of truth for chapter audio URLs.
 * Returns e.g. https://mp3.smartjpr.com/Chapter1.mp3 for chapter 1.
 */
export function getChapterAudioUrl(chapterNumber: number): string {
  if (
    !Number.isInteger(chapterNumber) ||
    chapterNumber < 1 ||
    chapterNumber > TOTAL_CHAPTERS
  ) {
    throw new RangeError(
      `Chapter number must be an integer from 1 to ${TOTAL_CHAPTERS}, got ${chapterNumber}`,
    );
  }
  return `${AUDIO_BASE_URL}/Chapter${chapterNumber}.mp3`;
}

export type Chapter = {
  id: string;
  number: number;
  titleHindi: string;
  titleEnglish: string;
  description: string;
  image: ImageSourcePropType;
  audioUrl: string;
};

/**
 * Local artwork in assets/img is named by chapter number (1.jpg … 18.jpg).
 * Metro requires static `require` calls, so the map is written out explicitly.
 */
const CHAPTER_IMAGES: Record<number, ImageSourcePropType> = {
  1: require('../../assets/img/1.jpg'),
  2: require('../../assets/img/2.jpg'),
  3: require('../../assets/img/3.jpg'),
  4: require('../../assets/img/4.jpg'),
  5: require('../../assets/img/5.jpg'),
  6: require('../../assets/img/6.jpg'),
  7: require('../../assets/img/7.jpg'),
  8: require('../../assets/img/8.jpg'),
  9: require('../../assets/img/9.jpg'),
  10: require('../../assets/img/10.jpg'),
  11: require('../../assets/img/11.jpg'),
  12: require('../../assets/img/12.jpg'),
  13: require('../../assets/img/13.jpg'),
  14: require('../../assets/img/14.jpg'),
  15: require('../../assets/img/15.jpg'),
  16: require('../../assets/img/16.jpg'),
  17: require('../../assets/img/17.jpg'),
  18: require('../../assets/img/18.jpg'),
};

/** Artwork used for the Home hero. */
export const HERO_IMAGE: ImageSourcePropType = CHAPTER_IMAGES[1];

type ChapterMeta = Pick<Chapter, 'titleHindi' | 'titleEnglish' | 'description'>;

const CHAPTER_META: ChapterMeta[] = [
  { titleHindi: 'अर्जुनविषादयोग', titleEnglish: 'Arjuna Vishada Yoga', description: 'कुरुक्षेत्र में स्वजनों को सामने देखकर अर्जुन का शोक और दुविधा' },
  { titleHindi: 'सांख्ययोग', titleEnglish: 'Sankhya Yoga', description: 'आत्मा की अमरता और निष्काम कर्म का उपदेश' },
  { titleHindi: 'कर्मयोग', titleEnglish: 'Karma Yoga', description: 'कर्तव्य कर्म और यज्ञभाव से कर्म करने का महत्व' },
  { titleHindi: 'ज्ञानकर्मसंन्यासयोग', titleEnglish: 'Jnana Karma Sanyasa Yoga', description: 'ज्ञान, कर्म और अवतार के रहस्य का वर्णन' },
  { titleHindi: 'कर्मसंन्यासयोग', titleEnglish: 'Karma Sanyasa Yoga', description: 'कर्मसंन्यास और कर्मयोग की तुलना' },
  { titleHindi: 'आत्मसंयमयोग', titleEnglish: 'Atma Samyama Yoga', description: 'ध्यान, मन का संयम और योगी के लक्षण' },
  { titleHindi: 'ज्ञानविज्ञानयोग', titleEnglish: 'Jnana Vijnana Yoga', description: 'परमात्मा के ज्ञान और विज्ञान का वर्णन' },
  { titleHindi: 'अक्षरब्रह्मयोग', titleEnglish: 'Akshara Brahma Yoga', description: 'अक्षर ब्रह्म और अंतकाल के स्मरण का महत्व' },
  { titleHindi: 'राजविद्याराजगुह्ययोग', titleEnglish: 'Raja Vidya Raja Guhya Yoga', description: 'राजविद्या, राजगुह्य और भक्ति की महिमा' },
  { titleHindi: 'विभूतियोग', titleEnglish: 'Vibhuti Yoga', description: 'भगवान की दिव्य विभूतियों का वर्णन' },
  { titleHindi: 'विश्वरूपदर्शनयोग', titleEnglish: 'Vishvarupa Darshana Yoga', description: 'अर्जुन को भगवान के विराट विश्वरूप का दर्शन' },
  { titleHindi: 'भक्तियोग', titleEnglish: 'Bhakti Yoga', description: 'भक्ति का मार्ग और प्रिय भक्त के लक्षण' },
  { titleHindi: 'क्षेत्रक्षेत्रज्ञविभागयोग', titleEnglish: 'Kshetra Kshetrajna Vibhaga Yoga', description: 'क्षेत्र (शरीर) और क्षेत्रज्ञ (आत्मा) का विवेक' },
  { titleHindi: 'गुणत्रयविभागयोग', titleEnglish: 'Gunatraya Vibhaga Yoga', description: 'सत्त्व, रज और तम — तीन गुणों का स्वरूप' },
  { titleHindi: 'पुरुषोत्तमयोग', titleEnglish: 'Purushottama Yoga', description: 'संसार रूपी अश्वत्थ वृक्ष और पुरुषोत्तम का स्वरूप' },
  { titleHindi: 'दैवासुरसम्पद्विभागयोग', titleEnglish: 'Daivasura Sampad Vibhaga Yoga', description: 'दैवी और आसुरी संपदा के लक्षण' },
  { titleHindi: 'श्रद्धात्रयविभागयोग', titleEnglish: 'Shraddhatraya Vibhaga Yoga', description: 'तीन प्रकार की श्रद्धा, आहार, यज्ञ, तप और दान' },
  { titleHindi: 'मोक्षसंन्यासयोग', titleEnglish: 'Moksha Sanyasa Yoga', description: 'संन्यास, त्याग और सम्पूर्ण गीता का सार' },
];

export const CHAPTERS: readonly Chapter[] = CHAPTER_META.map((meta, index) => {
  const number = index + 1;
  return {
    id: `chapter-${number}`,
    number,
    ...meta,
    image: CHAPTER_IMAGES[number],
    audioUrl: getChapterAudioUrl(number),
  };
});

export function getChapter(chapterNumber: number): Chapter | undefined {
  return CHAPTERS[chapterNumber - 1];
}

/** "अध्याय 1" */
export function chapterLabel(chapterNumber: number): string {
  return `अध्याय ${chapterNumber}`;
}
