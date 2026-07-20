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
    sections: [
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
    ],
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
    sections: [
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
    ],
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
    sections: [
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
    ],
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

export function isThemeId(v: string): v is ThemeId {
  return v === 'super-classic' || v === 'elegan-grey' || v === 'blue-flowers'
}
