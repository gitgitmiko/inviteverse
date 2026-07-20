import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import defaultData from '../../data/invitation.json'
import type { InvitationData } from '../../lib/invitationStore'
import { resolveGuestNameFromSearch } from '../../lib/guestInvite'
import { getThemeVisual, slotBackgroundStyle } from '../../lib/themeStyle'
import type { SectionVisual } from '../../lib/themeTypes'
import {
  FreeOrnamentsLayer,
  PhotoFrameSlot,
  sectionSlotProps,
  SlotChrome,
} from '../../components/SlotChrome'
import {
  useScrollPreviewToSection,
  type PreviewFocusTarget,
} from '../../components/useScrollPreviewToSection'
import MusicPlayer from '../../components/MusicPlayer'
import SafeImage from '../../components/SafeImage'
import Reveal, { RevealRootProvider } from '../../components/Reveal'
import './blue-flowers.css'

type Props = {
  data?: InvitationData
  forceOpen?: boolean
  hideBack?: boolean
  previewMode?: boolean
  focusSection?: PreviewFocusTarget | null
  focusNonce?: number
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Cincin bunga SVG — slot admin (bukan aset Indoinvite) */
function FloralRing({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <svg
      className={`bf-ring bf-ring--${size}`}
      viewBox="0 0 200 200"
      aria-hidden
      data-slot={size === 'lg' ? 'photo-ring-lg' : 'photo-ring'}
    >
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        stroke="#005189"
        strokeWidth="1.2"
        opacity="0.35"
      />
      <circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="#359bb7"
        strokeWidth="2.5"
        strokeDasharray="4 7"
        opacity="0.7"
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x = 100 + Math.cos(rad) * 88
        const y = 100 + Math.sin(rad) * 88
        return (
          <g key={deg} transform={`translate(${x} ${y}) rotate(${deg + 90})`}>
            <ellipse cx="0" cy="-4" rx="5" ry="9" fill="#2276b1" opacity="0.85" />
            <ellipse cx="-4" cy="2" rx="4" ry="7" fill="#359bb7" opacity="0.75" />
            <ellipse cx="4" cy="2" rx="4" ry="7" fill="#005189" opacity="0.65" />
            <circle cx="0" cy="0" r="2.2" fill="#d7f4ff" />
          </g>
        )
      })}
    </svg>
  )
}

function FloralSpray({
  position,
  slot,
}: {
  position: 'top' | 'bottom'
  slot: string
}) {
  return (
    <div
      className={`bf-spray bf-spray--${position}`}
      data-slot={slot}
      aria-hidden
    >
      <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`bf-g-${position}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94deff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#005189" stopOpacity="0.75" />
          </linearGradient>
        </defs>
        {[40, 100, 160, 220, 280, 340].map((x, i) => (
          <g key={x} transform={`translate(${x} ${position === 'top' ? 70 : 40})`}>
            <ellipse
              cx="0"
              cy={position === 'top' ? -18 : 18}
              rx="14"
              ry="22"
              fill={`url(#bf-g-${position})`}
              opacity={0.55 + (i % 3) * 0.1}
              transform={`rotate(${-25 + i * 12})`}
            />
            <ellipse
              cx="-12"
              cy={position === 'top' ? -6 : 8}
              rx="10"
              ry="16"
              fill="#2276b1"
              opacity="0.5"
              transform={`rotate(${-40 + i * 8})`}
            />
            <ellipse
              cx="12"
              cy={position === 'top' ? -6 : 8}
              rx="10"
              ry="16"
              fill="#359bb7"
              opacity="0.55"
              transform={`rotate(${20 + i * 6})`}
            />
            <circle cx="0" cy={position === 'top' ? -4 : 4} r="4" fill="#d7f4ff" />
          </g>
        ))}
      </svg>
    </div>
  )
}

function FloralDivider() {
  return (
    <div className="bf-divider" data-slot="event-divider" aria-hidden>
      <svg viewBox="0 0 120 40">
        <line x1="8" y1="20" x2="40" y2="20" stroke="#005189" strokeOpacity="0.35" />
        <g transform="translate(60 20)">
          <ellipse cx="0" cy="-6" rx="6" ry="10" fill="#2276b1" />
          <ellipse cx="-6" cy="2" rx="5" ry="8" fill="#359bb7" />
          <ellipse cx="6" cy="2" rx="5" ry="8" fill="#005189" />
          <circle cx="0" cy="0" r="2.5" fill="#d7f4ff" />
        </g>
        <line x1="80" y1="20" x2="112" y2="20" stroke="#005189" strokeOpacity="0.35" />
      </svg>
    </div>
  )
}

function SectionShell({
  children,
  variant = 'ats',
  className = '',
  section,
  fallbackBg,
  sectionId,
}: {
  children: ReactNode
  variant?: 'ats' | 'bga'
  className?: string
  section?: SectionVisual
  fallbackBg?: string
  sectionId?: string
}) {
  const slot = section
    ? sectionSlotProps(section, fallbackBg)
    : {
        background: undefined,
        ornaments: [] as SectionVisual['ornaments'],
        textColor: undefined as string | undefined,
        fallbackBg,
      }

  const hasCustomOrn = (slot.ornaments?.length ?? 0) > 0

  return (
    <SlotChrome
      sectionId={sectionId}
      className={`bf-shell bf-shell--${variant} ${className}`}
      {...slot}
    >
      {!hasCustomOrn && (
        <FloralSpray
          position="top"
          slot={variant === 'ats' ? 'section-top' : 'section-top-alt'}
        />
      )}
      <div className="bf-shell__body">{children}</div>
      {!hasCustomOrn && (
        <FloralSpray
          position="bottom"
          slot={variant === 'bga' ? 'section-bottom-alt' : 'section-bottom'}
        />
      )}
    </SlotChrome>
  )
}

function FadeHero({
  images,
  intervalMs = 6000,
}: {
  images: string[]
  intervalMs?: number
}) {
  const slides = images.filter(Boolean).slice(0, 6)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      intervalMs,
    )
    return () => window.clearInterval(id)
  }, [slides.length, intervalMs])

  if (!slides.length) return <div className="bf-fade-hero bf-fade-hero--empty" />

  return (
    <div className="bf-fade-hero">
      {slides.map((src, i) => (
        <div
          key={src + i}
          className={`bf-fade-hero__slide ${i === active ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="bf-fade-hero__overlay" />
    </div>
  )
}

function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now())
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target])

  return (
    <div className="bf-count">
      {(
        [
          ['Hari', left.d],
          ['Jam', left.h],
          ['Menit', left.m],
          ['Detik', left.s],
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="bf-count__cell">
          <strong>{pad(value)}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

function CirclePhoto({
  src,
  alt,
  size = 'md',
  frameSrc,
  frameTransform,
}: {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  frameSrc?: string
  frameTransform?: import('../../lib/themeTypes').SlotTransform
}) {
  return (
    <PhotoFrameSlot
      frameSrc={frameSrc}
      frameTransform={frameTransform}
      className={`bf-circle bf-circle--${size}`}
    >
      <div className="bf-circle__photo">
        <SafeImage src={src} alt={alt} />
      </div>
      {!frameSrc && (
        <FloralRing size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
      )}
    </PhotoFrameSlot>
  )
}

export default function BlueFlowers({
  data: dataProp,
  forceOpen = false,
  hideBack = false,
  previewMode = false,
  focusSection = null,
  focusNonce = 0,
}: Props) {
  const [params] = useSearchParams()
  const base = dataProp ?? defaultData
  const guestName = resolveGuestNameFromSearch(params, base.guestName)
  const [opened, setOpened] = useState(forceOpen)
  const [giftOpen, setGiftOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [rsvpDone, setRsvpDone] = useState(false)
  const scrollRootRef = useRef<HTMLDivElement | null>(null)

  const data = useMemo(
    () => ({ ...base, guestName }) as InvitationData,
    [base, guestName],
  )
  const isOpen = forceOpen || opened
  const visual = useMemo(
    () => getThemeVisual(data.themeStyles, 'blue-flowers'),
    [data],
  )

  useScrollPreviewToSection(
    scrollRootRef,
    focusSection,
    focusNonce,
    focusSection === 'cover' || isOpen,
  )
  const colors = visual.colors
  const themeVars = {
    '--bf-blue': colors.accent,
    '--bf-blue-mid': colors.muted,
    '--bf-blue-soft': colors.gold,
    '--bf-bg': colors.bg,
    '--bf-ink': colors.ink,
  } as CSSProperties
  const coverBg = slotBackgroundStyle(visual.cover.background, colors.bg)
  const tc = visual.cover.textColors
  const coupleFrames = visual.sections.couple.frames

  const heroImages = useMemo(() => {
    const list = [data.coverPhoto, ...data.gallery].filter(Boolean)
    return Array.from(new Set(list))
  }, [data.coverPhoto, data.gallery])

  const copy = async (n: string) => {
    try {
      await navigator.clipboard.writeText(n)
      setCopied(n)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div
      className={`bf ${isOpen ? 'is-open' : ''} ${previewMode ? 'bf--preview' : ''}`}
      style={themeVars}
      data-theme-frame
    >
      {!hideBack && (
        <Link to="/" className="theme-back">
          ← Home
        </Link>
      )}

      <div className="bf__stage">
        <RevealRootProvider rootRef={scrollRootRef}>
          <div className="bf__device" ref={scrollRootRef}>
            {!isOpen && (
              <section className="bf-cover" style={coverBg} data-section="cover">
                {!visual.cover.background.image && (
                  <div className="bf-cover__paper" aria-hidden />
                )}
                <FreeOrnamentsLayer ornaments={visual.cover.ornaments} />
                <div className="bf-cover__inner">
                  <Reveal anim="fade-down" once>
                    <p
                      className="bf-cover__eyebrow"
                      style={tc.eyebrow ? { color: tc.eyebrow } : undefined}
                    >
                      Save The Date
                    </p>
                  </Reveal>
                  <Reveal anim="fade-up" delay={80} once>
                    <h1
                      className="bf-cover__name bf-cover__name--left"
                      style={tc.name ? { color: tc.name } : undefined}
                    >
                      {data.groomNickname}
                    </h1>
                  </Reveal>
                  <Reveal anim="fade-up" delay={120} once>
                    <h1
                      className="bf-cover__name bf-cover__name--right"
                      style={tc.name ? { color: tc.name } : undefined}
                    >
                      <span>& </span>
                      {data.brideNickname}
                    </h1>
                  </Reveal>
                  <Reveal anim="zoom-in" delay={160} once>
                    <CirclePhoto
                      src={data.coverPhoto}
                      alt="Foto sampul"
                      size="lg"
                      frameSrc={visual.cover.photoFrame}
                      frameTransform={visual.cover.photoFrameTransform}
                    />
                  </Reveal>
                  <Reveal anim="fade-up" delay={200} once>
                    <p
                      className="bf-cover__to"
                      style={tc.guest ? { color: tc.guest } : undefined}
                    >
                      Kepada
                    </p>
                    <h3
                      className="bf-cover__guest"
                      style={tc.guest ? { color: tc.guest } : undefined}
                    >
                      Yth. {data.guestName}
                    </h3>
                  </Reveal>
                  <Reveal anim="zoom-in" delay={240} once>
                    <button
                      type="button"
                      className="bf-btn"
                      onClick={() => setOpened(true)}
                      style={{
                        ...(tc.buttonBg ? { background: tc.buttonBg } : {}),
                        ...(tc.buttonText ? { color: tc.buttonText } : {}),
                      }}
                    >
                      Buka Undangan
                    </button>
                  </Reveal>
                </div>
                <div className="bf-cover__bottom">
                  {(visual.cover.ornaments?.length ?? 0) === 0 ? (
                    <FloralSpray position="bottom" slot="cover-bottom" />
                  ) : null}
                </div>
              </section>
            )}

            {isOpen && (
              <main className="bf__main">
                <SlotChrome
                  sectionId="hero"
                  as="header"
                  className="bf-hero"
                  {...sectionSlotProps(visual.sections.hero)}
                >
                  <FadeHero images={heroImages} intervalMs={6000} />
                  <div className="bf-hero__overlay">
                    <Reveal anim="fade-up">
                      <h1>
                        {data.groomNickname} & {data.brideNickname}
                      </h1>
                    </Reveal>
                    <Reveal anim="zoom-in" delay={100}>
                      <Countdown target={data.countdownTarget} />
                    </Reveal>
                  </div>
                  <div className="bf-hero__spray">
                    {(visual.sections.hero.ornaments?.length ?? 0) === 0 ? (
                      <FloralSpray position="bottom" slot="hero-bottom" />
                    ) : null}
                  </div>
                </SlotChrome>

                <SectionShell
                  sectionId="intro"
                  variant="ats"
                  section={visual.sections.intro}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="fade-up">
                    <p className="bf-salam">{data.salam}</p>
                  </Reveal>
                  <Reveal anim="fade-up" delay={80}>
                    <p className="bf-lead">{data.intro}</p>
                  </Reveal>
                  <Reveal anim="fade-up" delay={120}>
                    <div className="bf-verse">
                      <p className="bf-verse__ar">{data.verse.arabic}</p>
                      <p>{data.verse.translation}</p>
                      <p className="bf-verse__src">— {data.verse.source} —</p>
                    </div>
                  </Reveal>
                </SectionShell>

                <SectionShell
                  sectionId="couple"
                  variant="bga"
                  section={visual.sections.couple}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="fade-up" className="bf-couple">
                    <div className="bf-couple__text">
                      <h2>{data.groomNickname}</h2>
                      <h3>{data.groom.fullName}</h3>
                      <p>{data.groom.parents}</p>
                      <p>
                        {data.groom.father} & {data.groom.mother}
                      </p>
                      <p>{data.groom.address}</p>
                      {data.groom.instagram && (
                        <a
                          className="bf-ig"
                          href={`https://instagram.com/${data.groom.instagram}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          @{data.groom.instagram}
                        </a>
                      )}
                    </div>
                    <Reveal anim="zoom-in" delay={100}>
                      <CirclePhoto
                        src={data.groom.photo}
                        alt={data.groom.fullName}
                        size="sm"
                        frameSrc={coupleFrames.groom}
                        frameTransform={
                          visual.sections.couple.framesTransform?.groom
                        }
                      />
                    </Reveal>
                  </Reveal>

                  <Reveal anim="zoom-in" className="bf-amp">
                    &
                  </Reveal>

                  <Reveal anim="fade-up" delay={80} className="bf-couple">
                    <div className="bf-couple__text bf-couple__text--end">
                      <h2>{data.brideNickname}</h2>
                      <h3>{data.bride.fullName}</h3>
                      <p>{data.bride.parents}</p>
                      <p>
                        {data.bride.father} & {data.bride.mother}
                      </p>
                      <p>{data.bride.address}</p>
                      {data.bride.instagram && (
                        <a
                          className="bf-ig"
                          href={`https://instagram.com/${data.bride.instagram}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          @{data.bride.instagram}
                        </a>
                      )}
                    </div>
                    <Reveal anim="zoom-in" delay={100}>
                      <CirclePhoto
                        src={data.bride.photo}
                        alt={data.bride.fullName}
                        size="sm"
                        frameSrc={coupleFrames.bride}
                        frameTransform={
                          visual.sections.couple.framesTransform?.bride
                        }
                      />
                    </Reveal>
                  </Reveal>
                </SectionShell>

                <SectionShell
                  sectionId="events"
                  variant="ats"
                  section={visual.sections.events}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="fade-up" className="bf-name-band">
                    <h2 className="bf-name-band__left">{data.groomNickname}</h2>
                    <h2 className="bf-name-band__right">
                      <span>& </span>
                      {data.brideNickname}
                    </h2>
                  </Reveal>
                  <Reveal anim="zoom-in" delay={100}>
                    <CirclePhoto
                      src={data.coverPhoto}
                      alt="Mempelai"
                      size="lg"
                      frameSrc={
                        visual.sections.events.frames.cover ||
                        visual.cover.photoFrame
                      }
                      frameTransform={
                        visual.sections.events.frames.cover
                          ? visual.sections.events.framesTransform?.cover
                          : visual.cover.photoFrameTransform
                      }
                    />
                  </Reveal>

                  <div className="bf-events">
                    {data.events.map((ev, i) => (
                      <div key={ev.title}>
                        <Reveal
                          anim="fade-up"
                          delay={i * 80}
                          className={`bf-event ${i % 2 === 1 ? 'bf-event--end' : ''}`}
                        >
                          <h3>{ev.title}</h3>
                          <p>{ev.date}</p>
                          <p>{ev.time}</p>
                          <p>{ev.place}</p>
                          <a href={ev.mapsUrl} target="_blank" rel="noreferrer">
                            Maps Lokasi Acara
                          </a>
                        </Reveal>
                        {i < data.events.length - 1 && (
                          <Reveal anim="fade-up">
                            <FloralDivider />
                          </Reveal>
                        )}
                      </div>
                    ))}
                  </div>
                  <Reveal anim="fade-up">
                    <p className="bf-hope">{data.closingHope}</p>
                  </Reveal>
                </SectionShell>

                <SectionShell
                  sectionId="story"
                  variant="bga"
                  section={visual.sections.story}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="fade-up">
                    <p className="bf-kicker">Sebuah Kisah</p>
                    <h2 className="bf-title">{data.story.title}</h2>
                  </Reveal>
                  {data.story.items.map((item, i) => (
                    <Reveal key={item.title} anim="fade-up" delay={i * 100}>
                      <article className="bf-story">
                        <h3>{item.title}</h3>
                        {item.date && <p className="bf-story__date">{item.date}</p>}
                        <p>{item.text}</p>
                      </article>
                    </Reveal>
                  ))}
                </SectionShell>

                <SectionShell
                  sectionId="timeline"
                  variant="ats"
                  section={visual.sections.timeline}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="zoom-in-up">
                    <h2 className="bf-title">Susunan Acara</h2>
                  </Reveal>
                  <ol className="bf-timeline">
                    {data.timeline.map((item, i) => (
                      <Reveal
                        key={item.title}
                        anim={i % 2 === 0 ? 'fade-right' : 'fade-left'}
                        delay={i * 80}
                        as="li"
                      >
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                        {(item.start || item.end) && (
                          <p className="bf-timeline__time">
                            {[item.start, item.end].filter(Boolean).join(' — ')}
                          </p>
                        )}
                      </Reveal>
                    ))}
                  </ol>
                </SectionShell>

                <SectionShell
                  sectionId="gift"
                  variant="bga"
                  section={visual.sections.gift}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="fade-up">
                    <h2 className="bf-title">Titip Hadiah</h2>
                    <p className="bf-lead">{data.gift.intro}</p>
                  </Reveal>
                  <Reveal anim="zoom-in" delay={60}>
                    <button
                      type="button"
                      className="bf-btn bf-btn--outline"
                      onClick={() => setGiftOpen((v) => !v)}
                    >
                      {giftOpen ? 'Sembunyikan Rekening' : 'Tampilkan Rekening'}
                    </button>
                  </Reveal>
                  {giftOpen && (
                    <div className="bf-accounts">
                      {data.gift.accounts.map((acc, i) => (
                        <Reveal key={acc.number} anim="fade-up" delay={i * 70}>
                          <div className="bf-account">
                            <p>{acc.bank}</p>
                            <strong>{acc.number}</strong>
                            <p>{acc.name}</p>
                            <button
                              type="button"
                              onClick={() => void copy(acc.number)}
                            >
                              {copied === acc.number ? 'Tersalin' : 'Copy'}
                            </button>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  )}
                </SectionShell>

                <SectionShell
                  sectionId="rsvp"
                  variant="ats"
                  className="bf-shell--rsvp"
                  section={visual.sections.rsvp}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="zoom-in">
                    <h2 className="bf-title">Kehadiran</h2>
                  </Reveal>
                  {rsvpDone ? (
                    <Reveal anim="fade-up">
                      <p className="bf-success">
                        Konfirmasi terkirim. Terima kasih!
                      </p>
                    </Reveal>
                  ) : (
                    <Reveal anim="fade-up" delay={80}>
                      <form
                        className="bf-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          setRsvpDone(true)
                        }}
                      >
                        <label>
                          Nama
                          <input name="nama" required />
                        </label>
                        <label>
                          Ucapan
                          <textarea name="ucapan" rows={3} />
                        </label>
                        <label>
                          Kehadiran
                          <select name="hadir" defaultValue="Hadir">
                            <option>Hadir</option>
                            <option>Tidak Hadir</option>
                          </select>
                        </label>
                        <button type="submit" className="bf-btn">
                          Kirim
                        </button>
                      </form>
                    </Reveal>
                  )}
                </SectionShell>

                <SectionShell
                  sectionId="gallery"
                  variant="bga"
                  section={visual.sections.gallery}
                  fallbackBg={colors.bg}
                >
                  <Reveal anim="fade-up">
                    <h2 className="bf-title">Our Gallery</h2>
                  </Reveal>
                  <div className="bf-gallery">
                    {data.gallery.map((src, i) => (
                      <Reveal
                        key={src}
                        anim={i % 2 === 0 ? 'fade-right' : 'fade-left'}
                        delay={i * 50}
                      >
                        <button
                          type="button"
                          onClick={() => setLightbox(src)}
                        >
                          <SafeImage src={src} alt="Galeri" />
                        </button>
                      </Reveal>
                    ))}
                  </div>
                </SectionShell>

                <SlotChrome
                  sectionId="footer"
                  as="footer"
                  className="bf-footer"
                  {...sectionSlotProps(visual.sections.footer, colors.bg)}
                >
                  {(visual.sections.footer.ornaments?.length ?? 0) === 0 && (
                    <FloralSpray position="top" slot="footer-top" />
                  )}
                  <Reveal anim="zoom-in">
                    <h2>
                      {data.groomNickname} & {data.brideNickname}
                    </h2>
                    <p>{data.thanks}</p>
                  </Reveal>
                </SlotChrome>
              </main>
            )}

            <MusicPlayer
              src={data.musicUrl}
              active={previewMode || isOpen}
              accent={colors.accent}
            />
          </div>
        </RevealRootProvider>
      </div>

      {lightbox && (
        <div className="bf-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  )
}
