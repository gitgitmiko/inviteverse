export type ThemeId =
  | 'super-classic'
  | 'elegan-grey'
  | 'blue-flowers'
  | 'classic-devotion'
  | 'red-essence'
  | 'snow-blue'
  | 'snow-pink'
  | 'burgundy-pure'
  | 'bear-brown'
  | 'infinite-gallop'
  | 'sun-moon'
  | 'royal-mega'
  | 'retro-romance'
  | 'padang-red'
  | 'nea-pure'
  | 'pink-envelope'
  | 'java-emerald'
  | 'java-atelier'
  | 'maso-rustic'
  | 'islamic-eternal'
  | 'islamic-serenity'
  | 'islamic-pure'
  | 'chinese-red'

export type SectionId =
  | 'hero'
  | 'intro'
  | 'couple'
  | 'events'
  | 'story'
  | 'timeline'
  | 'gift'
  | 'rsvp'
  | 'gallery'
  | 'footer'

export type SlotBackground = {
  mode: 'color' | 'image'
  color: string
  image: string
}

/** Posisi & skala aset admin (offset dalam %, scale 1 = 100%, rotate derajat) */
export type SlotTransform = {
  offsetX: number
  offsetY: number
  scale: number
  rotate: number
}

export type CoverTextColors = {
  eyebrow: string
  name: string
  guest: string
  buttonBg: string
  buttonText: string
}

export type CornerOrnaments = {
  topLeft: string
  topRight: string
  bottomLeft: string
  bottomRight: string
}

export type OrnamentAnim = 'none' | 'pulse' | 'sway' | 'float'

/** Ornamen bebas — admin bisa menambah beberapa & atur posisi masing-masing */
export type FreeOrnament = {
  id: string
  src: string
  anim: OrnamentAnim
  transform: SlotTransform
  /** Cermin horizontal (kiri ↔ kanan) */
  flipX: boolean
  /** Cermin vertikal (atas ↔ bawah) */
  flipY: boolean
}

export type CoverVisual = {
  ornaments: FreeOrnament[]
  photoFrame: string
  photoFrameTransform: SlotTransform
  background: SlotBackground
  textColors: CoverTextColors
  /** Super-Classic: 4 sudut (opsional tema lain abaikan) */
  corners: CornerOrnaments
}

export type SectionFrames = {
  cover: string
  groom: string
  bride: string
}

export type SectionFramesTransform = {
  cover: SlotTransform
  groom: SlotTransform
  bride: SlotTransform
}

export type SectionVisual = {
  ornaments: FreeOrnament[]
  background: SlotBackground
  textColor: string
  frames: SectionFrames
  framesTransform: SectionFramesTransform
}

export type ThemeColors = {
  accent: string
  gold: string
  ink: string
  muted: string
  bg: string
  card: string
}

export type ThemeVisualStyle = {
  colors: ThemeColors
  showPetals: boolean
  ornamentMode: 'svg' | 'image'
  cover: CoverVisual
  sections: Record<SectionId, SectionVisual>
}

export type ThemeStylesMap = Record<ThemeId, ThemeVisualStyle>
