/**
 * Paket satuan mengikuti Indoinvite (https://indoinvite.com/harga)
 * Hanya tier Satuan: Free → Premium.
 */

export type PlanId =
  | 'free'
  | 'basic'
  | 'klasik'
  | 'pro'
  | 'super'
  | 'premium'

export type PlanBenefits = {
  /** Maks foto galeri (0 = tidak bisa) */
  galleryMax: number
  music: boolean
  gift: boolean
  couplePhotos: boolean
  loveStory: boolean
  publish: boolean
  guestInvite: boolean
  maps: boolean
  countdown: boolean
  rsvp: boolean
  autoScroll: boolean
  streaming: boolean
  customMusic: boolean
  /** Label marketing / fitur masa depan */
  qrCheckin: boolean
  customColors: boolean
}

export type PlanDef = {
  id: PlanId
  name: string
  priceIdr: number
  blurb: string
  popular?: boolean
  benefits: PlanBenefits
  /** Poin tampilan di halaman harga */
  highlights: string[]
}

const baseAll: PlanBenefits = {
  galleryMax: 0,
  music: false,
  gift: false,
  couplePhotos: false,
  loveStory: false,
  publish: true,
  guestInvite: true,
  maps: true,
  countdown: true,
  rsvp: true,
  autoScroll: false,
  streaming: false,
  customMusic: false,
  qrCheckin: false,
  customColors: false,
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: 'free',
    name: 'Free',
    priceIdr: 0,
    blurb: 'Uji coba gratis tanpa batasan waktu',
    benefits: {
      ...baseAll,
      publish: false,
      couplePhotos: false,
      music: false,
      gift: false,
      galleryMax: 0,
      loveStory: false,
    },
    highlights: [
      'Akses tema published (preview)',
      'Edit konten terbatas',
      'RSVP & lokasi Maps (draft)',
      'Countdown',
      'Tidak bisa publish / sebar',
      '0 galeri · tanpa musik · tanpa titip hadiah',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    priceIdr: 39_000,
    blurb: 'Tanpa musik, titip hadiah dan foto',
    benefits: {
      ...baseAll,
      couplePhotos: false,
      music: false,
      gift: false,
      galleryMax: 0,
    },
    highlights: [
      'Semua fitur Free',
      'Bisa disebar tanpa batas penerima',
      'Tanpa musik',
      'Tanpa foto mempelai & titip hadiah',
      '0 galeri',
    ],
  },
  klasik: {
    id: 'klasik',
    name: 'Klasik',
    priceIdr: 59_000,
    blurb: 'Tanpa galeri dan titip hadiah',
    benefits: {
      ...baseAll,
      couplePhotos: true,
      music: true,
      gift: false,
      galleryMax: 0,
      loveStory: true,
    },
    highlights: [
      'Foto mempelai',
      'Musik undangan',
      'Love story',
      'Tanpa galeri',
      'Tanpa titip hadiah',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceIdr: 69_000,
    blurb: 'Bisa foto galeri dan titip hadiah',
    popular: true,
    benefits: {
      ...baseAll,
      couplePhotos: true,
      music: true,
      gift: true,
      galleryMax: 10,
      loveStory: true,
    },
    highlights: [
      'Semua fitur Klasik',
      'Galeri hingga 10 foto',
      'Titip hadiah / rekening',
      'Musik & love story',
    ],
  },
  super: {
    id: 'super',
    name: 'Super',
    priceIdr: 99_000,
    blurb: 'Galeri lebih banyak dan auto scroll',
    benefits: {
      ...baseAll,
      couplePhotos: true,
      music: true,
      gift: true,
      galleryMax: 15,
      loveStory: true,
      autoScroll: true,
      streaming: true,
    },
    highlights: [
      'Galeri hingga 15 foto',
      'Auto scroll',
      'Link streaming / video',
      'Titip hadiah & musik',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceIdr: 119_000,
    blurb: 'Semua fitur bisa dipakai tanpa batas',
    benefits: {
      ...baseAll,
      couplePhotos: true,
      music: true,
      gift: true,
      galleryMax: 20,
      loveStory: true,
      autoScroll: true,
      streaming: true,
      customMusic: true,
      qrCheckin: true,
      customColors: true,
    },
    highlights: [
      'Galeri hingga 20 foto [HD]',
      'Custom musik',
      'QR check-in tamu',
      'Semua fitur Super+',
    ],
  },
}

export const PLAN_LIST: PlanDef[] = [
  PLANS.free,
  PLANS.basic,
  PLANS.klasik,
  PLANS.pro,
  PLANS.super,
  PLANS.premium,
]

/** Paket berbayar (untuk checkout) */
export const PAID_PLAN_LIST = PLAN_LIST.filter((p) => p.priceIdr > 0)

export function formatIdr(amount: number): string {
  if (amount <= 0) return 'Rp.0'
  return `Rp.${amount.toLocaleString('id-ID')}`
}

export function getPlan(id: string | null | undefined): PlanDef {
  if (id && id in PLANS) return PLANS[id as PlanId]
  return PLANS.free
}

export function isPlanId(id: string): id is PlanId {
  return id in PLANS
}
