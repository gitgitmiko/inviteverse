import type { SectionId, ThemeId } from './themeTypes'

export type ThemeMeta = {
  id: ThemeId
  label: string
  route: string
  fonts: { display: string; script: string; body: string }
  /** Section yang ditampilkan di admin untuk tema ini */
  sections: SectionId[]
  /** Super-Classic punya 4 sudut cover */
  hasCoverCorners: boolean
  hasPetals: boolean
}

const NATURE_SECTIONS: SectionId[] = [
  'hero',
  'intro',
  'couple',
  'events',
  'story',
  'timeline',
  'gift',
  'rsvp',
  'gallery',
  'footer',
]

export const THEME_REGISTRY: Record<ThemeId, ThemeMeta> = {
  'super-classic': {
    id: 'super-classic',
    label: 'Super-Classic',
    route: '/a',
    fonts: {
      display: 'Great Vibes',
      script: 'Great Vibes',
      body: 'Work Sans',
    },
    sections: NATURE_SECTIONS,
    hasCoverCorners: true,
    hasPetals: true,
  },
  'elegan-grey': {
    id: 'elegan-grey',
    label: 'Elegan-Grey',
    route: '/eg',
    fonts: {
      display: 'Playfair Display',
      script: 'Engagement',
      body: 'Work Sans',
    },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'blue-flowers': {
    id: 'blue-flowers',
    label: 'Blue-Flowers',
    route: '/bf',
    fonts: {
      display: 'Great Vibes',
      script: 'Engagement',
      body: 'Poppins',
    },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'classic-devotion': {
    id: 'classic-devotion',
    label: 'Classic-Devotion',
    route: '/cd',
    fonts: {
      display: 'Elms Sans',
      script: 'Architects Daughter',
      body: 'Assistant',
    },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'red-essence': {
    id: 'red-essence',
    label: 'Red-Essence',
    route: '/re',
    fonts: {
      display: 'Great Vibes',
      script: 'Great Vibes',
      body: 'Assistant',
    },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'snow-blue': {
    id: 'snow-blue',
    label: 'Snow-Blue',
    route: '/sb',
    fonts: {
      display: 'Dancing Script',
      script: 'Dancing Script',
      body: 'Poppins',
    },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'snow-pink': {
    id: 'snow-pink',
    label: 'Snow-Pink',
    route: '/sp',
    fonts: {
      display: 'Dancing Script',
      script: 'Dancing Script',
      body: 'Poppins',
    },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'burgundy-pure': {
    id: 'burgundy-pure',
    label: 'Burgundy-Pure',
    route: '/bp',
    fonts: { display: 'Lavishly Yours', script: 'Lavishly Yours', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'bear-brown': {
    id: 'bear-brown',
    label: 'Bear-Brown',
    route: '/bb',
    fonts: { display: 'Orelega One', script: 'Orelega One', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'infinite-gallop': {
    id: 'infinite-gallop',
    label: 'Infinite-Gallop',
    route: '/ig',
    fonts: { display: 'Cinzel Decorative', script: 'Cinzel Decorative', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'sun-moon': {
    id: 'sun-moon',
    label: 'Sun-Moon',
    route: '/sm',
    fonts: { display: 'Mr De Haviland', script: 'Mr De Haviland', body: 'Cormorant Upright' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'royal-mega': {
    id: 'royal-mega',
    label: 'Royal-Mega',
    route: '/rm',
    fonts: { display: 'Cormorant Upright', script: 'Cormorant Upright', body: 'Cormorant Upright' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'retro-romance': {
    id: 'retro-romance',
    label: 'Retro-Romance',
    route: '/rr',
    fonts: { display: 'Englebert', script: 'Englebert', body: 'Englebert' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'padang-red': {
    id: 'padang-red',
    label: 'Padang-Red',
    route: '/pr',
    fonts: { display: 'Mr De Haviland', script: 'Mr De Haviland', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'nea-pure': {
    id: 'nea-pure',
    label: 'Nea-Pure',
    route: '/np',
    fonts: { display: 'Lavishly Yours', script: 'Lavishly Yours', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'pink-envelope': {
    id: 'pink-envelope',
    label: 'Pink-Envelope',
    route: '/pe',
    fonts: { display: 'Great Vibes', script: 'Great Vibes', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'java-emerald': {
    id: 'java-emerald',
    label: 'Java-Emerald',
    route: '/je',
    fonts: { display: 'Berkshire Swash', script: 'Berkshire Swash', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'java-atelier': {
    id: 'java-atelier',
    label: 'Java-Atelier',
    route: '/ja',
    fonts: { display: 'Lavishly Yours', script: 'Lavishly Yours', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'maso-rustic': {
    id: 'maso-rustic',
    label: 'Maso-Rustic',
    route: '/mr',
    fonts: { display: 'Mr De Haviland', script: 'Mr De Haviland', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'islamic-eternal': {
    id: 'islamic-eternal',
    label: 'Islamic-Eternal',
    route: '/ie',
    fonts: { display: 'Mr De Haviland', script: 'Mr De Haviland', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'islamic-serenity': {
    id: 'islamic-serenity',
    label: 'Islamic-Serenity',
    route: '/is',
    fonts: { display: 'Mr De Haviland', script: 'Mr De Haviland', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'islamic-pure': {
    id: 'islamic-pure',
    label: 'Islamic-Pure',
    route: '/ip',
    fonts: { display: 'Lora', script: 'Lora', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
  'chinese-red': {
    id: 'chinese-red',
    label: 'Chinese-Red',
    route: '/cr',
    fonts: { display: 'Orelega One', script: 'Orelega One', body: 'Assistant' },
    sections: NATURE_SECTIONS,
    hasCoverCorners: false,
    hasPetals: false,
  },
}

export const THEME_LIST = Object.values(THEME_REGISTRY)

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: 'Hero & Countdown',
  intro: 'Salam & Intro',
  couple: 'Mempelai',
  events: 'Acara',
  story: 'Love Story',
  timeline: 'Susunan Acara',
  gift: 'Titip Hadiah',
  rsvp: 'Kehadiran',
  gallery: 'Galeri',
  footer: 'Penutup',
}

const THEME_IDS: ThemeId[] = [
  'super-classic',
  'elegan-grey',
  'blue-flowers',
  'classic-devotion',
  'red-essence',
  'snow-blue',
  'snow-pink',
  'burgundy-pure',
  'bear-brown',
  'infinite-gallop',
  'sun-moon',
  'royal-mega',
  'retro-romance',
  'padang-red',
  'nea-pure',
  'pink-envelope',
  'java-emerald',
  'java-atelier',
  'maso-rustic',
  'islamic-eternal',
  'islamic-serenity',
  'islamic-pure',
  'chinese-red',
]

export function isThemeId(v: string): v is ThemeId {
  return (THEME_IDS as string[]).includes(v)
}
