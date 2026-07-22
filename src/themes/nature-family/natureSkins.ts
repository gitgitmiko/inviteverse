import type { ThemeId } from '../../lib/themeTypes'
import { ORNAMENT_ASSETS as O } from '../../lib/ornamentAssets'
import {
  NATURE_LAYOUTS,
  type NatureLayoutFlags,
} from './natureLayouts.generated'

/** Skin visual per tema Indoinvite (elegan-nature family). */
export type CouplePhotoShape =
  | 'rect'
  | 'arch-asymmetric'
  | 'arch-top'
  | 'pill'
  | 'rounded-rect'

/** Cover-open motion mapped from Indoinvite extras (orn-pilar/atas/bawah/…). */
export type CoverOpenAnim =
  | 'slide-x' // base orn-1..4 translateX ±100%
  | 'sink-down' // extras translateY(500%) — snow-blue
  | 'sink-blur' // sink + blur — snow-pink
  | 'sweep-side' // extras translateX(500%) — burgundy
  | 'burst-mix' // X sides + Y sink + fade — bear
  | 'burst-lift' // Y− lamps + sides + sink — infinite-gallop
  | 'sink-soft' // single orn-bawah Y — sun-moon
  | 'sink-scale' // sink + wrapper scale — royal-mega
  | 'soft-blur' // fade blur — retro-romance
  | 'burst-wide' // many wide X exits — padang-red
  | 'burst-split' // atas↑ + sides + bawah↓ — nea-pure
  | 'scale-rotate' // legacy / artistic fallback

export type CoverPhotoFrame = {
  width: string
  height: string
  borderRadius: string
  border: string
  outline: string
  outlineOffset: string
  marginTop: string
}

export type NatureSkin = {
  id: ThemeId
  label: string
  colors: {
    primary: string
    heading: string
    secondary: string
    paragraph: string
    other: string
  }
  fonts: {
    display: string
    body: string
  }
  cover: {
    align: 'end' | 'center'
    bodyWidth: string
    nameColor: 'other' | 'heading'
    overlay: string
    openAnim: CoverOpenAnim
    photo: CoverPhotoFrame | null
  }
  couple: {
    layout: 'band' | 'centered' | 'overlay' | 'labeled' | 'duo' | 'caption'
    photoShape: CouplePhotoShape
    photoCss: {
      width: string
      height: string
      borderRadius: string
      border?: string
      outline?: string
      outlineOffset?: string
    }
  }
  /** Layout parity per tema Indoinvite (dari scrape). */
  layout: NatureLayoutFlags
  showSnow: boolean
  coverOrnaments: string[]
}

const NATURE_IDS = [
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
] as const

export type NatureThemeId = (typeof NATURE_IDS)[number]

export function isNatureThemeId(id: ThemeId): id is NatureThemeId {
  return (NATURE_IDS as readonly string[]).includes(id)
}

const pill150: CoverPhotoFrame = {
  width: '150px',
  height: '250px',
  borderRadius: '200px',
  border: '1.5px solid var(--color-other)',
  outline: '2px solid var(--color-secondary)',
  outlineOffset: '5px',
  marginTop: '25px',
}

const couplePill = {
  layout: 'centered' as const,
  photoShape: 'pill' as const,
  photoCss: {
    width: '150px',
    height: '250px',
    borderRadius: '200px',
    outlineOffset: '5px',
    border: '4px solid var(--color-secondary)',
  },
}

/** Pill seperti Burgundy-Pure scrape (.profil-aes). */
const couplePillAes = {
  layout: 'centered' as const,
  photoShape: 'pill' as const,
  photoCss: {
    width: '150px',
    height: '250px',
    borderRadius: '200px',
    outlineOffset: '5px',
    border: '1.5px solid var(--color-heading)',
    outline: '2px solid var(--color-other)',
  },
}

const coupleArchTop = (
  w: string,
  h: string,
): NatureSkin['couple'] => ({
  layout: 'centered',
  photoShape: 'arch-top',
  photoCss: {
    width: w,
    height: h,
    borderRadius: '200px 200px 0 0',
    outlineOffset: '7px',
    border: '3px solid var(--color-secondary)',
  },
})

export const NATURE_SKINS: Record<NatureThemeId, NatureSkin> = {
  'classic-devotion': {
    id: 'classic-devotion',
    label: 'Classic-Devotion',
    colors: {
      primary: '#FFFFFF',
      heading: '#A49178',
      secondary: '#A49178',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Elms Sans', 'Assistant', system-ui, sans-serif",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'end',
      bodyWidth: '95%',
      nameColor: 'other',
      overlay: 'linear-gradient(180deg, #0000003b 30%, #000000ad 70%)',
      openAnim: 'slide-x',
      photo: null,
    },
    couple: {
      layout: 'band',
      photoShape: 'rect',
      photoCss: {
        width: '75%',
        height: '350px',
        borderRadius: '0',
        border: '4px solid var(--color-secondary)',
      },
    },
    layout: NATURE_LAYOUTS['classic-devotion'],
    showSnow: false,
    coverOrnaments: [],
  },
  'red-essence': {
    id: 'red-essence',
    label: 'Red-Essence',
    colors: {
      primary: '#FFFFFF',
      heading: '#621B26',
      secondary: '#621B26',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      // Indoinvite h1 = "Christmas" (OTF berlisensi) → Great Vibes
      display: "'Great Vibes', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'end',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #e6b1b400 30%, #f6f7f0cd 70%)',
      openAnim: 'slide-x',
      photo: {
        width: '270px',
        height: '360px',
        borderRadius: '200px 200px 50px 50px',
        border: '1.5px solid var(--color-other)',
        outline: '2px solid var(--color-secondary)',
        outlineOffset: '5px',
        marginTop: '25px',
      },
    },
    couple: {
      layout: 'overlay',
      photoShape: 'arch-asymmetric',
      photoCss: {
        width: '300px',
        height: '450px',
        borderRadius: '30px 200px 30px 30px',
        outlineOffset: '5px',
        border: '3px solid var(--color-secondary)',
      },
    },
    layout: NATURE_LAYOUTS['red-essence'],
    showSnow: false,
    coverOrnaments: [O.reRose, O.reRose, O.reRose, O.egFlourish],
  },
  'snow-blue': {
    id: 'snow-blue',
    label: 'Snow-Blue',
    colors: {
      primary: '#FFFFFF',
      heading: '#212121',
      secondary: '#2c7fb5',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Dancing Script', cursive",
      body: "'Poppins', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'other',
      overlay: 'linear-gradient(180deg, #0a203544 15%, #0a2035b8 80%)',
      openAnim: 'sink-down',
      photo: { ...pill150 },
    },
    couple: {
      layout: 'centered',
      photoShape: 'pill',
      photoCss: {
        width: '150px',
        height: '250px',
        borderRadius: '200px',
        outlineOffset: '5px',
        border: '1px solid var(--color-other)',
        outline: '1px solid var(--color-secondary)',
      },
    },
    layout: NATURE_LAYOUTS['snow-blue'],
    showSnow: true,
    coverOrnaments: [O.sbCrystal, O.sbCrystal, O.sbCrystal, O.sbCrystal],
  },
  'snow-pink': {
    id: 'snow-pink',
    label: 'Snow-Pink',
    colors: {
      primary: '#FFFFFF',
      heading: '#212121',
      secondary: '#F393B0',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Dancing Script', cursive",
      body: "'Poppins', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #fff2f8a3 40%, #ffffff 100%)',
      openAnim: 'sink-blur',
      photo: { ...pill150 },
    },
    couple: {
      layout: 'centered',
      photoShape: 'pill',
      photoCss: {
        width: '150px',
        height: '250px',
        borderRadius: '200px',
        outlineOffset: '5px',
        border: '1px solid var(--color-other)',
        outline: '1px solid var(--color-secondary)',
      },
    },
    layout: NATURE_LAYOUTS['snow-pink'],
    showSnow: true,
    coverOrnaments: [O.spPetal, O.spPetal, O.spPetal, O.batchFlourish],
  },
  'burgundy-pure': {
    id: 'burgundy-pure',
    label: 'Burgundy-Pure',
    colors: {
      // Scrape Indoinvite: --color-primary #f6f7f0
      primary: '#f6f7f0',
      heading: '#C7AA73',
      secondary: '#671C2E',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Lavishly Yours', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #01010100 0%, #f6f7f0 70%)',
      openAnim: 'sweep-side',
      photo: { ...pill150 },
    },
    couple: couplePillAes,
    layout: NATURE_LAYOUTS['burgundy-pure'],
    showSnow: false,
    coverOrnaments: [O.reRose, O.cdLeaf, O.reRose, O.cdLeaf],
  },
  'bear-brown': {
    id: 'bear-brown',
    label: 'Bear-Brown',
    colors: {
      primary: '#FFFFFF',
      heading: '#A5744B',
      secondary: '#835229',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      // Indoinvite h1 = "Spell" (TTF berlisensi) → Orelega One
      display: "'Orelega One', Georgia, serif",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #01010100 0%, #ffffff 70%)',
      openAnim: 'burst-mix',
      photo: {
        width: '175px',
        height: '250px',
        borderRadius: '200px 200px 0 0',
        border: '1.5px solid var(--color-other)',
        outline: '2px solid var(--color-secondary)',
        outlineOffset: '7px',
        marginTop: '25px',
      },
    },
    couple: {
      layout: 'labeled',
      photoShape: 'arch-top',
      photoCss: {
        width: '185px',
        height: '270px',
        borderRadius: '200px 200px 0 0',
        outlineOffset: '5px',
        border: '2px solid #804e09',
        outline: '1px solid #804e09',
      },
    },
    layout: NATURE_LAYOUTS['bear-brown'],
    showSnow: false,
    coverOrnaments: [O.cdLeaf, O.cdLeaf, O.batchFlourish, O.cdLeaf],
  },
  'infinite-gallop': {
    id: 'infinite-gallop',
    label: 'Infinite-Gallop',
    colors: {
      primary: '#FFFFFF',
      heading: '#E1BD68',
      secondary: '#A30000',
      paragraph: '#000000',
      other: '#FFFFFF',
    },
    fonts: {
      // Indoinvite h1 = "Spell" → Cinzel Decorative (beda dari bear)
      display: "'Cinzel Decorative', Georgia, serif",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #01010100 0%, #ffffff 70%)',
      openAnim: 'burst-lift',
      photo: { ...pill150 },
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['infinite-gallop'],
    showSnow: false,
    coverOrnaments: [O.reRose, O.egFlourish, O.reRose, O.egFlourish],
  },
  'sun-moon': {
    id: 'sun-moon',
    label: 'Sun-Moon',
    colors: {
      primary: '#1a1208',
      heading: '#ee9f0a',
      secondary: '#ee9f0a',
      paragraph: '#F9E8D1',
      other: '#FFFFFF',
    },
    fonts: {
      // Indoinvite h1 = "Basmala" → Mr De Haviland; body = Cormorant Upright
      display: "'Mr De Haviland', cursive",
      body: "'Cormorant Upright', Georgia, serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #1a120866 10%, #1a1208cc 80%)',
      openAnim: 'sink-soft',
      photo: {
        width: '220px',
        height: '300px',
        borderRadius: '200px 200px 0 0',
        border: '1.5px solid var(--color-heading)',
        outline: '2px solid var(--color-secondary)',
        outlineOffset: '7px',
        marginTop: '25px',
      },
    },
    couple: coupleArchTop('220px', '300px'),
    layout: NATURE_LAYOUTS['sun-moon'],
    showSnow: false,
    coverOrnaments: [O.sbCrystal, O.batchFlourish, O.sbCrystal, O.batchFlourish],
  },
  'royal-mega': {
    id: 'royal-mega',
    label: 'Royal-Mega',
    colors: {
      primary: '#FFFFFF',
      heading: '#fdc803',
      secondary: '#fdc803',
      paragraph: '#333333',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Cormorant Upright', Georgia, serif",
      body: "'Cormorant Upright', Georgia, serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #00000022 0%, #1a1508aa 75%)',
      openAnim: 'sink-scale',
      photo: { ...pill150 },
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['royal-mega'],
    showSnow: false,
    coverOrnaments: [O.egFlourish, O.batchFlourish, O.egFlourish, O.batchFlourish],
  },
  'retro-romance': {
    id: 'retro-romance',
    label: 'Retro-Romance',
    colors: {
      primary: '#2a2a2a',
      heading: '#FFFFFF',
      secondary: '#FFFFFF',
      paragraph: '#f0f0f0',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Englebert', cursive",
      body: "'Englebert', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'other',
      overlay: 'linear-gradient(180deg, #00000055 20%, #000000bb 85%)',
      openAnim: 'soft-blur',
      photo: {
        width: '255px',
        height: '400px',
        borderRadius: '10px',
        border: '2px solid var(--color-other)',
        outline: '1px solid rgba(255,255,255,0.35)',
        outlineOffset: '4px',
        marginTop: '30px',
      },
    },
    couple: {
      layout: 'duo',
      photoShape: 'rounded-rect',
      photoCss: {
        width: '165px',
        height: '255px',
        borderRadius: '10px',
        border: '2px solid var(--color-other)',
      },
    },
    layout: NATURE_LAYOUTS['retro-romance'],
    showSnow: false,
    coverOrnaments: [O.spPetal, O.cdLeaf, O.spPetal, O.cdLeaf],
  },
  'padang-red': {
    id: 'padang-red',
    label: 'Padang-Red',
    colors: {
      primary: '#FFFFFF',
      heading: '#fd841b',
      secondary: '#6C0000',
      paragraph: '#000000',
      other: '#FFFFFF',
    },
    fonts: {
      // Indoinvite h1 = "Basmala" → Mr De Haviland
      display: "'Mr De Haviland', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #6C000022 0%, #ffffff 75%)',
      openAnim: 'burst-wide',
      photo: { ...pill150 },
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['padang-red'],
    showSnow: false,
    coverOrnaments: [O.reRose, O.reRose, O.cdLeaf, O.reRose],
  },
  'nea-pure': {
    id: 'nea-pure',
    label: 'Nea-Pure',
    colors: {
      primary: '#FFFFFF',
      heading: '#8A3DA9',
      secondary: '#551270',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Lavishly Yours', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #01010100 0%, #ffffff 70%)',
      openAnim: 'burst-split',
      photo: {
        width: '220px',
        height: '310px',
        borderRadius: '200px 200px 0 0',
        border: '1.5px solid var(--color-other)',
        outline: '2px solid var(--color-secondary)',
        outlineOffset: '5px',
        marginTop: '25px',
      },
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['nea-pure'],
    showSnow: false,
    coverOrnaments: [O.spPetal, O.sbCrystal, O.spPetal, O.sbCrystal],
  },
  'pink-envelope': {
    id: 'pink-envelope',
    label: 'Pink-Envelope',
    colors: {
      primary: '#E6B1B4',
      heading: '#E6B1B4',
      secondary: '#FFFFFF',
      paragraph: '#000000',
      other: '#A67C83',
    },
    fonts: {
      display: "'Great Vibes', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'end',
      bodyWidth: '95%',
      nameColor: 'other',
      overlay: 'linear-gradient(180deg, #e6b1b400 30%, #e6b1b4ba 70%)',
      openAnim: 'soft-blur',
      photo: null,
    },
    couple: {
      layout: 'centered',
      photoShape: 'pill',
      photoCss: {
        width: '150px',
        height: '250px',
        borderRadius: '200px',
        outlineOffset: '5px',
        border: '1.5px solid var(--color-other)',
        outline: '2px solid var(--color-secondary)',
      },
    },
    layout: NATURE_LAYOUTS['pink-envelope'],
    showSnow: false,
    coverOrnaments: [O.spPetal, O.spPetal, O.batchFlourish, O.spPetal],
  },
  'java-emerald': {
    id: 'java-emerald',
    label: 'Java-Emerald',
    colors: {
      primary: '#1C3000',
      heading: '#FFFFFF',
      secondary: '#FFD69C',
      paragraph: '#FFFFFF',
      other: '#252525',
    },
    fonts: {
      display: "'Berkshire Swash', Georgia, serif",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #1c300066 15%, #1c3000cc 85%)',
      openAnim: 'burst-split',
      photo: null,
    },
    couple: {
      layout: 'caption',
      photoShape: 'rounded-rect',
      photoCss: {
        width: '240px',
        height: '340px',
        borderRadius: '10px',
        outlineOffset: '7px',
        border: '3px solid var(--color-secondary)',
      },
    },
    layout: NATURE_LAYOUTS['java-emerald'],
    showSnow: false,
    coverOrnaments: [O.cdLeaf, O.batchFlourish, O.cdLeaf, O.batchFlourish],
  },
  'java-atelier': {
    id: 'java-atelier',
    label: 'Java-Atelier',
    colors: {
      primary: '#F5F0E7',
      heading: '#004869',
      secondary: '#004869',
      paragraph: '#212121',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Lavishly Yours', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #00486922 0%, #f5f0e7ee 75%)',
      openAnim: 'burst-mix',
      photo: null,
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['java-atelier'],
    showSnow: false,
    coverOrnaments: [O.egFlourish, O.cdLeaf, O.egFlourish, O.cdLeaf],
  },
  'maso-rustic': {
    id: 'maso-rustic',
    label: 'Maso-Rustic',
    colors: {
      primary: '#FFFFFF',
      heading: '#322012',
      secondary: '#322012',
      paragraph: '#000000',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Mr De Haviland', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #32201233 10%, #322012aa 90%)',
      openAnim: 'burst-wide',
      photo: null,
    },
    couple: coupleArchTop('180px', '260px'),
    layout: NATURE_LAYOUTS['maso-rustic'],
    showSnow: false,
    coverOrnaments: [O.cdLeaf, O.cdLeaf, O.batchFlourish, O.cdLeaf],
  },
  'islamic-eternal': {
    id: 'islamic-eternal',
    label: 'Islamic-Eternal',
    colors: {
      primary: '#0A878E',
      heading: '#ffffff',
      secondary: '#A88000',
      paragraph: '#ffffff',
      other: '#094f43',
    },
    fonts: {
      display: "'Mr De Haviland', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #094f4366 10%, #094f43cc 90%)',
      openAnim: 'burst-lift',
      photo: { ...pill150 },
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['islamic-eternal'],
    showSnow: false,
    coverOrnaments: [O.sbCrystal, O.batchFlourish, O.sbCrystal, O.batchFlourish],
  },
  'islamic-serenity': {
    id: 'islamic-serenity',
    label: 'Islamic-Serenity',
    colors: {
      primary: '#0A878E',
      heading: '#FFFFFF',
      secondary: '#E1BD68',
      paragraph: '#FFFFFF',
      other: '#094f43',
    },
    fonts: {
      display: "'Mr De Haviland', cursive",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #ffffff55 0%, #0a878ecc 80%)',
      openAnim: 'sink-scale',
      photo: { ...pill150 },
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['islamic-serenity'],
    showSnow: false,
    coverOrnaments: [O.egFlourish, O.sbCrystal, O.egFlourish, O.sbCrystal],
  },
  'islamic-pure': {
    id: 'islamic-pure',
    label: 'Islamic-Pure',
    colors: {
      primary: '#0A878E',
      heading: '#FFFFFF',
      secondary: '#094f43',
      paragraph: '#FFFFFF',
      other: '#000000',
    },
    fonts: {
      display: "'Lora', Georgia, serif",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #ffffff44 0%, #094f43cc 85%)',
      openAnim: 'sink-soft',
      photo: null,
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['islamic-pure'],
    showSnow: false,
    coverOrnaments: [O.batchFlourish, O.cdLeaf, O.batchFlourish, O.cdLeaf],
  },
  'chinese-red': {
    id: 'chinese-red',
    label: 'Chinese-Red',
    colors: {
      primary: '#A30000',
      heading: '#E1BD68',
      secondary: '#A30000',
      paragraph: '#000000',
      other: '#FFFFFF',
    },
    fonts: {
      display: "'Orelega One', Georgia, serif",
      body: "'Assistant', system-ui, sans-serif",
    },
    cover: {
      align: 'center',
      bodyWidth: '100%',
      nameColor: 'heading',
      overlay: 'linear-gradient(180deg, #a3000022 0%, #a30000bb 80%)',
      openAnim: 'burst-split',
      photo: { ...pill150 },
    },
    couple: couplePill,
    layout: NATURE_LAYOUTS['chinese-red'],
    showSnow: false,
    coverOrnaments: [O.reRose, O.egFlourish, O.reRose, O.egFlourish],
  },
}

export function getNatureSkin(themeId: ThemeId): NatureSkin {
  if (isNatureThemeId(themeId)) return NATURE_SKINS[themeId]
  return NATURE_SKINS['classic-devotion']
}
