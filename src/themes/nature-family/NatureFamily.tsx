import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import defaultData from '../../data/invitation.json'
import type { InvitationData } from '../../lib/invitationStore'
import type { ThemeId } from '../../lib/themeTypes'
import { resolveGuestNameFromSearch } from '../../lib/guestInvite'
import { getThemeVisual, slotBackgroundStyle } from '../../lib/themeStyle'
import { sectionSlotProps, SlotChrome } from '../../components/SlotChrome'
import {
  useScrollPreviewToSection,
  type PreviewFocusTarget,
} from '../../components/useScrollPreviewToSection'
import MusicPlayer from '../../components/MusicPlayer'
import SafeImage from '../../components/SafeImage'
import Reveal, { RevealRootProvider } from '../../components/Reveal'
import { getNatureSkin, type NatureThemeId } from './natureSkins'
import { SECTION_SKINS } from './sectionSkins'
import './nature-family.css'

type Props = {
  themeId: ThemeId
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

function toYoutubeEmbed(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    const v = u.searchParams.get('v')
    if (v) return `https://www.youtube.com/embed/${v}`
    const parts = u.pathname.split('/')
    const embedIdx = parts.indexOf('embed')
    if (embedIdx >= 0 && parts[embedIdx + 1]) {
      return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`
    }
  } catch {
    return null
  }
  return null
}

/** Parse "Anggara, 4-5 Maret 2025" → bagian kartu acara. */
function parseEventDate(date: string) {
  const m = date.match(/^([^,]+),\s*(\d[\d-]*)\s+(.+)$/)
  if (m) {
    const monthYear = m[3].trim()
    const my = monthYear.match(/^(\S+)\s+(\d{4})$/)
    return {
      dayName: m[1].trim(),
      dayNum: m[2].trim(),
      monthYear,
      month: my ? my[1] : monthYear,
      year: my ? my[2] : '',
    }
  }
  return { dayName: date, dayNum: '', monthYear: '', month: '', year: '' }
}

function SnowParticles() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 10) * 0.45}s`,
        duration: `${7 + (i % 6)}s`,
        size: 3 + (i % 5),
      })),
    [],
  )
  return (
    <div className="nf-snow" aria-hidden>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="nf-snow__flake"
          style={{
            left: f.left,
            animationDelay: f.delay,
            animationDuration: f.duration,
            width: f.size,
            height: f.size,
          }}
        />
      ))}
    </div>
  )
}

function FadeSlider({
  images,
  intervalMs = 5000,
  className = '',
}: {
  images: string[]
  intervalMs?: number
  className?: string
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

  if (!slides.length) return <div className={className} />

  return (
    <div className={className}>
      {slides.map((src, i) => (
        <div
          key={src + i}
          className={`nf-header__slide ${i === active ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  )
}

function PhotoMarquee({ images }: { images: string[] }) {
  const base = (images.length ? images : []).slice(0, 5)
  const track = [...base, ...base]
  if (!base.length) return null

  return (
    <div className="nf-marquee-wrap">
      <div className="nf-marquee__track">
        {track.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="nf-marquee__slide"
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
      </div>
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

  const cells = [
    { n: left.d, l: 'Hari' },
    { n: left.h, l: 'Jam' },
    { n: left.m, l: 'Menit' },
    { n: left.s, l: 'Detik' },
  ]

  return (
    <div className="nf-count">
      {cells.map((c) => (
        <div key={c.l} className="nf-count__cell">
          <span className="nf-count__num">{pad(c.n)}</span>
          <span className="nf-count__label">{c.l}</span>
        </div>
      ))}
    </div>
  )
}

export default function NatureFamily({
  themeId,
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
  const [coverLeaving, setCoverLeaving] = useState(false)
  const [giftOpen, setGiftOpen] = useState(() => getNatureSkin(themeId).layout.giftVariant === 'cards')
  const [copied, setCopied] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [rsvpDone, setRsvpDone] = useState(false)

  const data = useMemo(
    () => ({ ...base, guestName }) as InvitationData,
    [base, guestName],
  )
  const isOpen = forceOpen || opened
  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const visual = useMemo(
    () => getThemeVisual(data.themeStyles, themeId),
    [data, themeId],
  )

  useScrollPreviewToSection(
    scrollRootRef,
    focusSection,
    focusNonce,
    focusSection === 'cover' || isOpen,
  )

  useEffect(() => {
    if (forceOpen) setOpened(true)
  }, [forceOpen])

  const skin = useMemo(() => getNatureSkin(themeId), [themeId])
  const sectionSkin = SECTION_SKINS[themeId as NatureThemeId] ?? SECTION_SKINS['classic-devotion']
  const colors = visual.colors
  const themeVars = {
    '--color-primary': skin.colors.primary,
    '--color-heading': skin.colors.heading,
    '--color-secondary': skin.colors.secondary,
    '--color-paragraph': skin.colors.paragraph,
    '--color-other': skin.colors.other,
    '--text-button': skin.colors.other,
    '--nf-font-display': skin.fonts.display,
    '--nf-font-body': skin.fonts.body,
    '--nf-cover-overlay': skin.cover.overlay,
    '--nf-cover-body-w': skin.cover.bodyWidth,
    '--nf-bg-header': sectionSkin.header.background,
    '--nf-bg-couple': sectionSkin.couple.background,
    '--nf-bg-intro': sectionSkin.intro.background,
    '--nf-bg-events': sectionSkin.events.background,
    '--nf-bg-story': sectionSkin.story.background,
    '--nf-bg-gift': sectionSkin.gift.background,
    '--nf-bg-rsvp': sectionSkin.rsvp.background,
    '--nf-bg-gallery': sectionSkin.gallery.background,
    '--nf-bg-footer': sectionSkin.footer.background,
    '--nf-event-radius': sectionSkin.events.cardRadius,
  } as CSSProperties

  const coverBgStyle: CSSProperties = {
    ...slotBackgroundStyle(visual.cover.background, colors.bg),
    backgroundColor: skin.colors.primary,
    ...(data.coverPhoto
      ? {
          backgroundImage: `url(${data.coverPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
        }
      : {}),
  }

  const heroImages = useMemo(() => {
    const list = [data.coverPhoto, ...data.gallery].filter(Boolean)
    return Array.from(new Set(list))
  }, [data.coverPhoto, data.gallery])

  const marqueeImages = useMemo(() => {
    const list = [
      data.coverPhoto,
      data.groom.photo,
      data.bride.photo,
      ...data.gallery,
    ].filter(Boolean)
    return Array.from(new Set(list)).slice(0, 5)
  }, [data.coverPhoto, data.groom.photo, data.bride.photo, data.gallery])

  const coverOrns = skin.coverOrnaments
  const layout = skin.layout
  const youtubeEmbed = useMemo(
    () => toYoutubeEmbed(data.liveStreaming?.url),
    [data.liveStreaming?.url],
  )

  const photoStyle: CSSProperties = {
    width: skin.couple.photoCss.width,
    height: skin.couple.photoCss.height,
    borderRadius: skin.couple.photoCss.borderRadius,
    border: skin.couple.photoCss.border,
    outline: skin.couple.photoCss.outline,
    outlineOffset: skin.couple.photoCss.outlineOffset,
  }
  const coverNameColor =
    skin.cover.nameColor === 'heading'
      ? skin.colors.heading
      : skin.colors.other

  const openCover = () => {
    setOpened(true)
    setCoverLeaving(true)
    window.setTimeout(() => setCoverLeaving(false), 2100)
  }

  const copy = async (n: string) => {
    try {
      await navigator.clipboard.writeText(n)
      setCopied(n)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  const showCover = !forceOpen && (!isOpen || coverLeaving)

  return (
    <div
      className={`nf ${isOpen ? 'is-open' : ''} ${previewMode ? 'nf--preview' : ''}`}
      style={themeVars}
      data-theme-frame
      data-skin={skin.id}
      data-cover-align={skin.cover.align}
      data-cover-anim={skin.cover.openAnim}
      data-couple-layout={skin.couple.layout}
      data-photo-shape={skin.couple.photoShape}
      data-events-variant={layout.eventsVariant}
      data-story-variant={layout.storyVariant}
      data-events-tone={sectionSkin.events.onAccent || 'light'}
      data-gift-tone={sectionSkin.gift.onAccent || 'light'}
      data-rsvp-tone={sectionSkin.rsvp.onAccent || 'light'}
      data-footer-tone={sectionSkin.footer.onAccent || 'light'}
    >
      {!hideBack && (
        <Link to="/" className="theme-back">
          ← Home
        </Link>
      )}

      <div className="nf__stage">
        <RevealRootProvider rootRef={scrollRootRef}>
          <div className="nf__device" ref={scrollRootRef}>
            {showCover && (
              <section
                className={`nf-cover ${coverLeaving ? 'cover-opened' : ''}`}
                style={coverBgStyle}
                data-section="cover"
              >
                <div className="nf-cover__overlay" style={{ backgroundImage: skin.cover.overlay }} />
                {skin.showSnow && <SnowParticles />}
                {coverOrns.length > 0 && (
                  <div className="nf-cover__orns">
                    {coverOrns.map((src, i) => (
                      <div
                        key={`cover-orn-${i + 1}`}
                        className={`nf-cover__orn nf-cover__orn--${i + 1}`}
                      >
                        <SafeImage
                          className="nf-cover__orn-img"
                          src={src}
                          alt=""
                          eager
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="nf-cover__wrapper">
                  <div className="nf-cover__body">
                    <p className="nf-cover__eyebrow" style={{ color: coverNameColor }}>
                      Happy Wedding
                    </p>
                    <h1 className="nf-cover__names" style={{ color: coverNameColor }}>
                      {data.groomNickname} & {data.brideNickname}
                    </h1>
                    {skin.cover.photo && data.coverPhoto && (
                      <div
                        className="nf-cover__photo"
                        style={{
                          width: skin.cover.photo.width,
                          // tinggi responsif via CSS max-height; aspect dari scrape
                          aspectRatio: `${parseFloat(skin.cover.photo.width) || 150} / ${parseFloat(skin.cover.photo.height) || 250}`,
                          borderRadius: skin.cover.photo.borderRadius,
                          border: skin.cover.photo.border,
                          outline: skin.cover.photo.outline,
                          outlineOffset: skin.cover.photo.outlineOffset,
                          marginTop: skin.cover.photo.marginTop,
                          backgroundImage: `url(${data.coverPhoto})`,
                        }}
                        role="img"
                        aria-label="Foto sampul"
                      />
                    )}
                    <p className="nf-cover__to" style={{ color: coverNameColor }}>
                      Kepada
                    </p>
                    <h2 className="nf-cover__guest" style={{ color: coverNameColor }}>
                      Yth. {data.guestName}
                    </h2>
                    <p className="nf-cover__msg" style={{ color: coverNameColor }}>
                      {data.coverMessage ||
                        'Tanpa Mengurangi Rasa Hormat, Kami Mengundang Bapak/Ibu/Saudara/i untuk Hadir di Acara Kami.'}
                    </p>
                    {!isOpen && (
                      <button
                        type="button"
                        className="nf-btn-open"
                        onClick={openCover}
                      >
                        ✉ Buka Sampul
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {(isOpen || forceOpen) && (
              <main className="nf__main">
                <SlotChrome
                  sectionId="hero"
                  as="header"
                  className="nf-header"
                  {...sectionSlotProps(visual.sections.hero)}
                >
                  <FadeSlider
                    className="nf-header__slider"
                    images={heroImages}
                    intervalMs={5000}
                  />
                  <div className="nf-header__overlay" />
                  <div className="nf-header__content">
                    <div>
                      <Reveal anim="fade-down" duration={2000}>
                        <h1 className="nf-header__names">
                          {data.groomNickname} & {data.brideNickname}
                        </h1>
                      </Reveal>
                      <Reveal anim="fade-up" delay={200} duration={2000}>
                        <Countdown target={data.countdownTarget} />
                      </Reveal>
                      <div className="nf-header__scroll">
                        <div className="nf-mouse" aria-hidden>
                          <span className="nf-mouse__arrow" />
                          <span className="nf-mouse__arrow" />
                          <span className="nf-mouse__arrow" />
                        </div>
                      </div>
                    </div>
                  </div>
                </SlotChrome>

                <SlotChrome
                  sectionId="couple"
                  className="nf-couple"
                  {...sectionSlotProps(visual.sections.couple)}
                >
                  {layout.showMarquee && <PhotoMarquee images={marqueeImages} />}
                  <div className="nf-couple__inner">
                    <Reveal anim="fade-down" duration={2000}>
                      <p className="nf-salam">{data.salam || data.verse.arabic}</p>
                    </Reveal>
                    <Reveal anim="zoom-in" duration={2000}>
                      <p className="nf-intro-box">{data.intro}</p>
                    </Reveal>

                    {skin.couple.layout === 'caption' ? (
                      <>
                        <div className="nf-caption nf-caption--groom">
                          <Reveal anim="fade-left" duration={1800}>
                            <p className="nf-caption__role">The Groom</p>
                          </Reveal>
                          <Reveal anim="zoom-in" duration={2000} className="nf-caption__frame-wrap">
                            <div
                              className="nf-caption__frame"
                              style={{
                                ...photoStyle,
                                backgroundImage: `url(${data.groom.photo})`,
                              }}
                              role="img"
                              aria-label={data.groom.fullName}
                            >
                              <div className="nf-caption__overlay">
                                <Reveal anim="fade-left" duration={2000}>
                                  <h3 className="nf-caption__name">{data.groom.fullName}</h3>
                                </Reveal>
                                <Reveal anim="fade-right" duration={2000}>
                                  <div className="nf-caption__meta">
                                    <p>{data.groom.parents}</p>
                                    <p>
                                      {data.groom.father} & {data.groom.mother}
                                    </p>
                                    {data.groom.address && (
                                      <p>Beralamat di {data.groom.address}</p>
                                    )}
                                  </div>
                                </Reveal>
                              </div>
                            </div>
                          </Reveal>
                          {data.groom.instagram && (
                            <Reveal anim="fade-up" duration={1800}>
                              <a
                                className="nf-person__ig nf-person__ig--accent nf-caption__ig"
                                href={`https://instagram.com/${data.groom.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                @{data.groom.instagram}
                              </a>
                            </Reveal>
                          )}
                        </div>

                        <Reveal anim="fade-up" duration={1800}>
                          <p className="nf-sparator">&</p>
                        </Reveal>

                        <div className="nf-caption nf-caption--bride">
                          <Reveal anim="fade-left" duration={1800}>
                            <p className="nf-caption__role nf-caption__role--bride">The Bride</p>
                          </Reveal>
                          <Reveal anim="zoom-in" duration={2000} className="nf-caption__frame-wrap">
                            <div
                              className="nf-caption__frame"
                              style={{
                                ...photoStyle,
                                backgroundImage: `url(${data.bride.photo})`,
                              }}
                              role="img"
                              aria-label={data.bride.fullName}
                            >
                              <div className="nf-caption__overlay">
                                <Reveal anim="fade-left" duration={2000}>
                                  <h3 className="nf-caption__name">{data.bride.fullName}</h3>
                                </Reveal>
                                <Reveal anim="fade-right" duration={2000}>
                                  <div className="nf-caption__meta">
                                    <p>{data.bride.parents}</p>
                                    <p>
                                      {data.bride.father} & {data.bride.mother}
                                    </p>
                                    {data.bride.address && (
                                      <p>Beralamat di {data.bride.address}</p>
                                    )}
                                  </div>
                                </Reveal>
                              </div>
                            </div>
                          </Reveal>
                          {data.bride.instagram && (
                            <Reveal anim="fade-up" duration={1800}>
                              <a
                                className="nf-person__ig nf-person__ig--accent nf-caption__ig"
                                href={`https://instagram.com/${data.bride.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                @{data.bride.instagram}
                              </a>
                            </Reveal>
                          )}
                        </div>
                      </>
                    ) : skin.couple.layout === 'duo' ? (
                      <>
                        <div className="nf-duo nf-duo--groom">
                          <Reveal anim="zoom-in" duration={2000} className="nf-duo__photo-col">
                            <div
                              className="nf-person__photo nf-person__photo--skin"
                              style={{
                                ...photoStyle,
                                margin: '0 auto',
                              }}
                              role="img"
                              aria-label={data.groom.fullName}
                            />
                          </Reveal>
                          <div className="nf-duo__text nf-duo__text--end">
                            <Reveal anim="fade-left" duration={2000}>
                              <h3 className="nf-duo__name">{data.groom.fullName}</h3>
                            </Reveal>
                            <Reveal anim="fade-right" duration={2000}>
                              <div className="nf-duo__meta">
                                <p>{data.groom.parents}</p>
                                <p>
                                  {data.groom.father} & {data.groom.mother}
                                </p>
                                {data.groom.address && (
                                  <p>Beralamat di {data.groom.address}</p>
                                )}
                              </div>
                            </Reveal>
                            {data.groom.instagram && (
                              <Reveal anim="fade-up" duration={1800}>
                                <a
                                  className="nf-person__ig nf-person__ig--accent"
                                  href={`https://instagram.com/${data.groom.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.groom.instagram}
                                </a>
                              </Reveal>
                            )}
                          </div>
                        </div>

                        <Reveal anim="fade-up" duration={1800}>
                          <p className="nf-sparator">&</p>
                        </Reveal>

                        <div className="nf-duo nf-duo--bride">
                          <div className="nf-duo__text nf-duo__text--start">
                            <Reveal anim="fade-left" duration={2000}>
                              <h3 className="nf-duo__name">{data.bride.fullName}</h3>
                            </Reveal>
                            <Reveal anim="fade-right" duration={2000}>
                              <div className="nf-duo__meta">
                                <p>{data.bride.parents}</p>
                                <p>
                                  {data.bride.father} & {data.bride.mother}
                                </p>
                                {data.bride.address && (
                                  <p>Beralamat di {data.bride.address}</p>
                                )}
                              </div>
                            </Reveal>
                            {data.bride.instagram && (
                              <Reveal anim="fade-up" duration={1800}>
                                <a
                                  className="nf-person__ig nf-person__ig--accent"
                                  href={`https://instagram.com/${data.bride.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.bride.instagram}
                                </a>
                              </Reveal>
                            )}
                          </div>
                          <Reveal anim="zoom-in" duration={2000} className="nf-duo__photo-col">
                            <div
                              className="nf-person__photo nf-person__photo--skin"
                              style={{
                                ...photoStyle,
                                margin: '0 auto',
                              }}
                              role="img"
                              aria-label={data.bride.fullName}
                            />
                          </Reveal>
                        </div>
                      </>
                    ) : skin.couple.layout === 'labeled' ? (
                      <>
                        <div className="nf-person-labeled">
                          <Reveal anim="zoom-in" duration={2000}>
                            <div
                              className="nf-person__photo nf-person__photo--skin"
                              style={{
                                ...photoStyle,
                                margin: '25px auto 0',
                              }}
                              role="img"
                              aria-label={data.groom.fullName}
                            />
                          </Reveal>
                          <Reveal anim="fade-up" duration={1800}>
                            <p className="nf-person-labeled__role">The Groom</p>
                          </Reveal>
                          <Reveal anim="fade-up" duration={1800}>
                            <h3 className="nf-person-labeled__nick">{data.groomNickname}</h3>
                          </Reveal>
                          <Reveal anim="fade-left" duration={2000}>
                            <h3 className="nf-person__name nf-person__name--ink">
                              {data.groom.fullName}
                            </h3>
                          </Reveal>
                          <Reveal anim="fade-right" duration={2000}>
                            <div className="nf-person__meta nf-person__meta--ink">
                              <p>{data.groom.parents}</p>
                              <p>
                                {data.groom.father} & {data.groom.mother}
                              </p>
                              {data.groom.address && (
                                <p>Beralamat di {data.groom.address}</p>
                              )}
                            </div>
                          </Reveal>
                          {data.groom.instagram && (
                            <Reveal anim="fade-up" duration={1800}>
                              <a
                                className="nf-person__ig nf-person__ig--accent"
                                href={`https://instagram.com/${data.groom.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                @{data.groom.instagram}
                              </a>
                            </Reveal>
                          )}
                        </div>

                        <Reveal anim="fade-up" duration={1800}>
                          <p className="nf-sparator">&</p>
                        </Reveal>

                        <div className="nf-person-labeled">
                          <Reveal anim="zoom-in" duration={2000}>
                            <div
                              className="nf-person__photo nf-person__photo--skin"
                              style={{
                                ...photoStyle,
                                margin: '25px auto 0',
                              }}
                              role="img"
                              aria-label={data.bride.fullName}
                            />
                          </Reveal>
                          <Reveal anim="fade-up" duration={1800}>
                            <p className="nf-person-labeled__role">The Bride</p>
                          </Reveal>
                          <Reveal anim="fade-up" duration={1800}>
                            <h3 className="nf-person-labeled__nick">{data.brideNickname}</h3>
                          </Reveal>
                          <Reveal anim="fade-left" duration={2000}>
                            <h3 className="nf-person__name nf-person__name--ink">
                              {data.bride.fullName}
                            </h3>
                          </Reveal>
                          <Reveal anim="fade-right" duration={2000}>
                            <div className="nf-person__meta nf-person__meta--ink">
                              <p>{data.bride.parents}</p>
                              <p>
                                {data.bride.father} & {data.bride.mother}
                              </p>
                              {data.bride.address && (
                                <p>Beralamat di {data.bride.address}</p>
                              )}
                            </div>
                          </Reveal>
                          {data.bride.instagram && (
                            <Reveal anim="fade-up" duration={1800}>
                              <a
                                className="nf-person__ig nf-person__ig--accent"
                                href={`https://instagram.com/${data.bride.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                @{data.bride.instagram}
                              </a>
                            </Reveal>
                          )}
                        </div>
                      </>
                    ) : skin.couple.layout === 'overlay' ? (
                      <>
                        <div className="nf-person-overlay nf-person-overlay--groom">
                          <Reveal anim="zoom-in" duration={2000} className="nf-person-overlay__frame-wrap">
                            <div
                              className="nf-person-overlay__frame"
                              style={{
                                ...photoStyle,
                                borderRadius: '30px 200px 30px 30px',
                                backgroundImage: `url(${data.groom.photo})`,
                              }}
                              role="img"
                              aria-label={data.groom.fullName}
                            >
                              {data.groom.instagram && (
                                <a
                                  className="nf-person-overlay__ig nf-person-overlay__ig--groom"
                                  href={`https://instagram.com/${data.groom.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.groom.instagram}
                                </a>
                              )}
                              <div className="nf-person-overlay__foot">
                                <div className="nf-person-overlay__card">
                                  <div className="nf-person-overlay__info">
                                    <Reveal anim="fade-left" duration={2000}>
                                      <h3 className="nf-person-overlay__nick">
                                        {data.groomNickname}
                                      </h3>
                                    </Reveal>
                                    <Reveal anim="fade-left" duration={2000}>
                                      <p className="nf-person-overlay__fullname">
                                        {data.groom.fullName}
                                      </p>
                                    </Reveal>
                                    <Reveal anim="fade-right" duration={2000}>
                                      <div className="nf-person-overlay__meta">
                                        <p>{data.groom.parents}</p>
                                        <p>
                                          {data.groom.father} & {data.groom.mother}
                                        </p>
                                        {data.groom.address && (
                                          <p>Beralamat di {data.groom.address}</p>
                                        )}
                                      </div>
                                    </Reveal>
                                  </div>
                                  <div className="nf-person-overlay__tab">
                                    <span>The Groom</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Reveal>
                        </div>

                        <Reveal anim="fade-up" duration={1800}>
                          <p className="nf-sparator">&</p>
                        </Reveal>

                        <div className="nf-person-overlay nf-person-overlay--bride">
                          <Reveal anim="zoom-in" duration={2000} className="nf-person-overlay__frame-wrap">
                            <div
                              className="nf-person-overlay__frame"
                              style={{
                                ...photoStyle,
                                borderRadius: '200px 30px 30px 30px',
                                backgroundImage: `url(${data.bride.photo})`,
                              }}
                              role="img"
                              aria-label={data.bride.fullName}
                            >
                              {data.bride.instagram && (
                                <a
                                  className="nf-person-overlay__ig nf-person-overlay__ig--bride"
                                  href={`https://instagram.com/${data.bride.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.bride.instagram}
                                </a>
                              )}
                              <div className="nf-person-overlay__foot">
                                <div className="nf-person-overlay__card nf-person-overlay__card--bride">
                                  <div className="nf-person-overlay__tab nf-person-overlay__tab--bride">
                                    <span>The Bride</span>
                                  </div>
                                  <div className="nf-person-overlay__info nf-person-overlay__info--bride">
                                    <Reveal anim="fade-left" duration={2000}>
                                      <h3 className="nf-person-overlay__nick">
                                        {data.brideNickname}
                                      </h3>
                                    </Reveal>
                                    <Reveal anim="fade-left" duration={2000}>
                                      <p className="nf-person-overlay__fullname">
                                        {data.bride.fullName}
                                      </p>
                                    </Reveal>
                                    <Reveal anim="fade-right" duration={2000}>
                                      <div className="nf-person-overlay__meta">
                                        <p>{data.bride.parents}</p>
                                        <p>
                                          {data.bride.father} & {data.bride.mother}
                                        </p>
                                        {data.bride.address && (
                                          <p>Beralamat di {data.bride.address}</p>
                                        )}
                                      </div>
                                    </Reveal>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Reveal>
                        </div>
                      </>
                    ) : skin.couple.layout === 'centered' ? (
                      layout.coupleReveal === 'granular' ? (
                        <>
                          <div className="nf-person-center">
                            <Reveal anim="zoom-in" duration={2000}>
                              <div
                                className="nf-person__photo nf-person__photo--skin"
                                style={{
                                  ...photoStyle,
                                  backgroundImage: `url(${data.groom.photo})`,
                                  margin: '25px auto 0',
                                }}
                                role="img"
                                aria-label={data.groom.fullName}
                              />
                            </Reveal>
                            <Reveal anim="fade-left" duration={2000}>
                              <h3 className="nf-person__name nf-person__name--ink">
                                {data.groom.fullName}
                              </h3>
                            </Reveal>
                            <Reveal anim="fade-right" duration={2000}>
                              <div className="nf-person__meta nf-person__meta--ink">
                                <p>{data.groom.parents}</p>
                                <p>
                                  {data.groom.father} & {data.groom.mother}
                                </p>
                                {data.groom.address && (
                                  <p>Beralamat di {data.groom.address}</p>
                                )}
                              </div>
                            </Reveal>
                            {data.groom.instagram && (
                              <Reveal anim="fade-up" duration={1800}>
                                <a
                                  className="nf-person__ig nf-person__ig--accent"
                                  href={`https://instagram.com/${data.groom.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.groom.instagram}
                                </a>
                              </Reveal>
                            )}
                          </div>

                          <Reveal anim="fade-up" duration={1800}>
                            <p className="nf-sparator">&</p>
                          </Reveal>

                          <div className="nf-person-center">
                            <Reveal anim="zoom-in" duration={2000}>
                              <div
                                className="nf-person__photo nf-person__photo--skin"
                                style={{
                                  ...photoStyle,
                                  backgroundImage: `url(${data.bride.photo})`,
                                  margin: '25px auto 0',
                                }}
                                role="img"
                                aria-label={data.bride.fullName}
                              />
                            </Reveal>
                            <Reveal anim="fade-left" duration={2000}>
                              <h3 className="nf-person__name nf-person__name--ink">
                                {data.bride.fullName}
                              </h3>
                            </Reveal>
                            <Reveal anim="fade-right" duration={2000}>
                              <div className="nf-person__meta nf-person__meta--ink">
                                <p>{data.bride.parents}</p>
                                <p>
                                  {data.bride.father} & {data.bride.mother}
                                </p>
                                {data.bride.address && (
                                  <p>Beralamat di {data.bride.address}</p>
                                )}
                              </div>
                            </Reveal>
                            {data.bride.instagram && (
                              <Reveal anim="fade-up" duration={1800}>
                                <a
                                  className="nf-person__ig nf-person__ig--accent"
                                  href={`https://instagram.com/${data.bride.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.bride.instagram}
                                </a>
                              </Reveal>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <Reveal anim="fade-up" duration={2200} className="nf-person-center">
                            <div
                              className="nf-person__photo nf-person__photo--skin"
                              style={{
                                ...photoStyle,
                                backgroundImage: `url(${data.groom.photo})`,
                                margin: '25px auto 0',
                              }}
                              role="img"
                              aria-label={data.groom.fullName}
                            />
                            <h3 className="nf-person__name nf-person__name--ink">
                              {data.groom.fullName}
                            </h3>
                            <div className="nf-person__meta nf-person__meta--ink">
                              <p>{data.groom.parents}</p>
                              <p>
                                {data.groom.father} & {data.groom.mother}
                              </p>
                              {data.groom.address && (
                                <p>Beralamat di {data.groom.address}</p>
                              )}
                            </div>
                            {data.groom.instagram && (
                              <a
                                className="nf-person__ig nf-person__ig--accent"
                                href={`https://instagram.com/${data.groom.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                @{data.groom.instagram}
                              </a>
                            )}
                          </Reveal>

                          <p className="nf-sparator">&</p>

                          <Reveal
                            anim="fade-up"
                            delay={120}
                            duration={2200}
                            className="nf-person-center"
                          >
                            <div
                              className="nf-person__photo nf-person__photo--skin"
                              style={{
                                ...photoStyle,
                                backgroundImage: `url(${data.bride.photo})`,
                                margin: '25px auto 0',
                              }}
                              role="img"
                              aria-label={data.bride.fullName}
                            />
                            <h3 className="nf-person__name nf-person__name--ink">
                              {data.bride.fullName}
                            </h3>
                            <div className="nf-person__meta nf-person__meta--ink">
                              <p>{data.bride.parents}</p>
                              <p>
                                {data.bride.father} & {data.bride.mother}
                              </p>
                              {data.bride.address && (
                                <p>Beralamat di {data.bride.address}</p>
                              )}
                            </div>
                            {data.bride.instagram && (
                              <a
                                className="nf-person__ig nf-person__ig--accent"
                                href={`https://instagram.com/${data.bride.instagram}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                @{data.bride.instagram}
                              </a>
                            )}
                          </Reveal>
                        </>
                      )
                    ) : layout.coupleReveal === 'granular' ? (
                      <>
                        <div className="nf-person nf-person--groom">
                          <div className="nf-person__row">
                            <Reveal
                              anim="fade-up"
                              duration={1800}
                              className="nf-person__label-wrap"
                            >
                              <div className="nf-person__label">
                                <h2 className="nf-person__label-main">Groom</h2>
                                <p className="nf-person__label-sub">The</p>
                              </div>
                            </Reveal>
                            <Reveal
                              anim="zoom-in"
                              duration={2000}
                              className="nf-person__photo-wrap"
                            >
                              <div
                                className="nf-person__photo nf-person__photo--skin"
                                style={{
                                  ...photoStyle,
                                  width: '100%',
                                  backgroundImage: `url(${data.groom.photo})`,
                                }}
                                role="img"
                                aria-label={data.groom.fullName}
                              />
                            </Reveal>
                          </div>
                          <div className="nf-person__band-wrap">
                            <div className="nf-person__band">
                              <Reveal anim="fade-left" duration={2000}>
                                <h3 className="nf-person__name">{data.groom.fullName}</h3>
                              </Reveal>
                              <Reveal anim="fade-right" duration={2000}>
                                <p className="nf-person__meta">
                                  {data.groom.parents} {data.groom.father} &{' '}
                                  {data.groom.mother}
                                  {data.groom.address
                                    ? ` Beralamat di ${data.groom.address}`
                                    : ''}
                                </p>
                              </Reveal>
                              {data.groom.instagram && (
                                <Reveal anim="fade-up" duration={1800}>
                                  <a
                                    className="nf-person__ig"
                                    href={`https://instagram.com/${data.groom.instagram}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    @{data.groom.instagram}
                                  </a>
                                </Reveal>
                              )}
                            </div>
                          </div>
                        </div>

                        <Reveal anim="fade-up" duration={1800}>
                          <p className="nf-sparator">&</p>
                        </Reveal>

                        <div className="nf-person nf-person--bride">
                          <div className="nf-person__row">
                            <Reveal
                              anim="zoom-in"
                              duration={2000}
                              className="nf-person__photo-wrap"
                            >
                              <div
                                className="nf-person__photo nf-person__photo--skin"
                                style={{
                                  ...photoStyle,
                                  width: '100%',
                                  backgroundImage: `url(${data.bride.photo})`,
                                }}
                                role="img"
                                aria-label={data.bride.fullName}
                              />
                            </Reveal>
                            <Reveal
                              anim="fade-up"
                              duration={1800}
                              className="nf-person__label-wrap"
                            >
                              <div className="nf-person__label">
                                <h2 className="nf-person__label-main">Bride</h2>
                                <p className="nf-person__label-sub">The</p>
                              </div>
                            </Reveal>
                          </div>
                          <div className="nf-person__band-wrap">
                            <div className="nf-person__band">
                              <Reveal anim="fade-left" duration={2000}>
                                <h3 className="nf-person__name">{data.bride.fullName}</h3>
                              </Reveal>
                              <Reveal anim="fade-right" duration={2000}>
                                <p className="nf-person__meta">
                                  {data.bride.parents} {data.bride.father} &{' '}
                                  {data.bride.mother}
                                  {data.bride.address
                                    ? ` Beralamat di ${data.bride.address}`
                                    : ''}
                                </p>
                              </Reveal>
                              {data.bride.instagram && (
                                <Reveal anim="fade-up" duration={1800}>
                                  <a
                                    className="nf-person__ig"
                                    href={`https://instagram.com/${data.bride.instagram}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    @{data.bride.instagram}
                                  </a>
                                </Reveal>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Reveal
                          anim="fade-up"
                          duration={2200}
                          className="nf-person nf-person--groom"
                        >
                          <div className="nf-person__row">
                            <div className="nf-person__label">
                              <h2 className="nf-person__label-main">Groom</h2>
                              <p className="nf-person__label-sub">The</p>
                            </div>
                            <div
                              className="nf-person__photo nf-person__photo--skin"
                              style={{
                                ...photoStyle,
                                backgroundImage: `url(${data.groom.photo})`,
                              }}
                              role="img"
                              aria-label={data.groom.fullName}
                            />
                          </div>
                          <div className="nf-person__band-wrap">
                            <div className="nf-person__band">
                              <h3 className="nf-person__name">{data.groom.fullName}</h3>
                              <p className="nf-person__meta">
                                {data.groom.parents} {data.groom.father} &{' '}
                                {data.groom.mother}
                                {data.groom.address
                                  ? ` Beralamat di ${data.groom.address}`
                                  : ''}
                              </p>
                              {data.groom.instagram && (
                                <a
                                  className="nf-person__ig"
                                  href={`https://instagram.com/${data.groom.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.groom.instagram}
                                </a>
                              )}
                            </div>
                          </div>
                        </Reveal>

                        <Reveal
                          anim="fade-up"
                          delay={120}
                          duration={2200}
                          className="nf-person nf-person--bride"
                        >
                          <div className="nf-person__row">
                            {skin.couple.photoShape === 'arch-asymmetric' ? (
                              <>
                                <div
                                  className="nf-person__photo nf-person__photo--skin nf-person__photo--bride-arch"
                                  style={{
                                    ...photoStyle,
                                    borderRadius: '200px 30px 30px 30px',
                                    backgroundImage: `url(${data.bride.photo})`,
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                  }}
                                  role="img"
                                  aria-label={data.bride.fullName}
                                />
                                <div className="nf-person__label">
                                  <h2 className="nf-person__label-main">Bride</h2>
                                  <p className="nf-person__label-sub">The</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div
                                  className="nf-person__photo nf-person__photo--skin"
                                  style={{
                                    ...photoStyle,
                                    backgroundImage: `url(${data.bride.photo})`,
                                  }}
                                  role="img"
                                  aria-label={data.bride.fullName}
                                />
                                <div className="nf-person__label">
                                  <h2 className="nf-person__label-main">Bride</h2>
                                  <p className="nf-person__label-sub">The</p>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="nf-person__band-wrap">
                            <div className="nf-person__band">
                              <h3 className="nf-person__name">{data.bride.fullName}</h3>
                              <p className="nf-person__meta">
                                {data.bride.parents} {data.bride.father} &{' '}
                                {data.bride.mother}
                                {data.bride.address
                                  ? ` Beralamat di ${data.bride.address}`
                                  : ''}
                              </p>
                              {data.bride.instagram && (
                                <a
                                  className="nf-person__ig"
                                  href={`https://instagram.com/${data.bride.instagram}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  @{data.bride.instagram}
                                </a>
                              )}
                            </div>
                          </div>
                        </Reveal>
                      </>
                    )}

                    {layout.verseInCouple && (
                      <Reveal anim="fade-up" duration={2000}>
                        <div className="nf-verse nf-verse--in-couple">
                          <p className="nf-verse__ar">{data.verse.arabic}</p>
                          <p>{data.verse.translation}</p>
                          <p className="nf-verse__src">— {data.verse.source} —</p>
                        </div>
                      </Reveal>
                    )}
                  </div>
                </SlotChrome>

                {!layout.verseInCouple && (
                  <SlotChrome
                    sectionId="intro"
                    className="nf-section nf-section--muted"
                    {...sectionSlotProps(visual.sections.intro)}
                  >
                    <Reveal anim="fade-up" duration={2000}>
                      <p className="nf-kicker">Save The Date</p>
                      <div className="nf-verse">
                        <p className="nf-verse__ar">{data.verse.arabic}</p>
                        <p>{data.verse.translation}</p>
                        <p className="nf-verse__src">— {data.verse.source} —</p>
                      </div>
                    </Reveal>
                  </SlotChrome>
                )}

                <SlotChrome
                  sectionId="events"
                  className="nf-section nf-section--accent"
                  {...sectionSlotProps(visual.sections.events)}
                >
                  <Reveal
                    anim={
                      layout.eventsVariant === 'split' ||
                      layout.eventsVariant === 'classic' ||
                      layout.eventsVariant === 'banner' ||
                      layout.eventsVariant === 'stack' ||
                      layout.eventsVariant === 'plain' ||
                      layout.eventsVariant === 'badge'
                        ? 'zoom-in-down'
                        : 'zoom-in-up'
                    }
                    duration={2000}
                  >
                    <h2
                      className={`nf-title${
                        layout.eventsVariant === 'classic' || layout.eventsVariant === 'banner'
                          ? ' nf-title--acara'
                          : layout.eventsVariant === 'stack' ||
                              layout.eventsVariant === 'plain' ||
                              layout.eventsVariant === 'badge'
                            ? ' nf-title--stack'
                            : ''
                      }`}
                    >
                      {layout.eventsVariant === 'overlay' ? 'Acara' : 'Save The Date Acara'}
                    </h2>
                  </Reveal>
                  <div className="nf-events">
                    {data.events.map((ev, i) => {
                      const bg = (data.gallery[i] || data.coverPhoto) ?? ''
                      if (layout.eventsVariant === 'badge') {
                        return (
                          <Reveal key={ev.title} anim="fade-up" delay={i * 100} duration={2000}>
                            <article className="nf-event nf-event--badge">
                              <h3 className="nf-event__badge-label">{ev.title}</h3>
                              <div className="nf-event__badge-body">
                                <p className="nf-event__badge-date">{ev.date}</p>
                                <p className="nf-event__badge-time">{ev.time}</p>
                                <p className="nf-event__badge-place">{ev.place}</p>
                                <a
                                  className="nf-event__badge-maps"
                                  href={ev.mapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Maps Lokasi Acara
                                </a>
                              </div>
                            </article>
                          </Reveal>
                        )
                      }
                      if (layout.eventsVariant === 'plain') {
                        return (
                          <Reveal key={ev.title} anim="fade-up" delay={i * 100} duration={2000}>
                            <article className="nf-event nf-event--plain">
                              <h3 className="nf-event__plain-title">{ev.title}</h3>
                              <p className="nf-event__plain-date">{ev.date}</p>
                              <p className="nf-event__plain-time">{ev.time}</p>
                              <p className="nf-event__plain-place">{ev.place}</p>
                              <a
                                className="nf-event__plain-maps"
                                href={ev.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Maps Lokasi Acara
                              </a>
                            </article>
                          </Reveal>
                        )
                      }
                      if (layout.eventsVariant === 'stack') {
                        const parts = parseEventDate(ev.date)
                        return (
                          <Reveal key={ev.title} anim="fade-up" delay={i * 100} duration={2000}>
                            <article className="nf-event nf-event--stack">
                              <h3 className="nf-event__stack-title">{ev.title}</h3>
                              <p className="nf-event__stack-day">
                                {parts.dayName}
                                {parts.dayNum ? ',' : ''}
                              </p>
                              {(parts.dayNum || parts.month || parts.year) && (
                                <div className="nf-event__stack-date">
                                  {parts.dayNum && (
                                    <span className="nf-event__stack-num">{parts.dayNum}</span>
                                  )}
                                  {(parts.month || parts.year) && (
                                    <div className="nf-event__stack-my">
                                      {parts.month && <p>{parts.month}</p>}
                                      {parts.year && <p>{parts.year}</p>}
                                    </div>
                                  )}
                                </div>
                              )}
                              <p className="nf-event__stack-time">{ev.time}</p>
                              <p className="nf-event__stack-place">{ev.place}</p>
                              <a
                                className="nf-event__stack-maps"
                                href={ev.mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Maps Lokasi Acara
                              </a>
                            </article>
                          </Reveal>
                        )
                      }
                      if (layout.eventsVariant === 'banner') {
                        const parts = parseEventDate(ev.date)
                        const dateLine = [parts.dayNum, parts.monthYear].filter(Boolean).join(' ')
                        return (
                          <Reveal key={ev.title} anim="fade-up" delay={i * 100} duration={2000}>
                            <article className="nf-event nf-event--banner">
                              <div
                                className="nf-event__media nf-event__media--banner"
                                style={{ backgroundImage: `url(${bg})` }}
                              >
                                <div className="nf-event__banner-title">
                                  <h3>{ev.title}</h3>
                                </div>
                              </div>
                              <div className="nf-event__banner-body">
                                <p className="nf-event__banner-day">
                                  {parts.dayName}
                                  {dateLine ? ',' : ''}
                                </p>
                                {dateLine && (
                                  <p className="nf-event__banner-date">{dateLine}</p>
                                )}
                                <p className="nf-event__banner-time">{ev.time}</p>
                                <p className="nf-event__banner-place">{ev.place}</p>
                                <a
                                  className="nf-event__banner-maps"
                                  href={ev.mapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Maps Lokasi Acara
                                </a>
                              </div>
                            </article>
                          </Reveal>
                        )
                      }
                      if (layout.eventsVariant === 'classic') {
                        const parts = parseEventDate(ev.date)
                        return (
                          <Reveal key={ev.title} anim="fade-up" delay={i * 100} duration={2000}>
                            <article className="nf-event nf-event--classic">
                              <div
                                className="nf-event__media nf-event__media--classic"
                                style={{ backgroundImage: `url(${bg})` }}
                              />
                              <div className="nf-event__classic-body">
                                <div className="nf-event__classic-title">
                                  <h3>{ev.title}</h3>
                                </div>
                                <div className="nf-event__classic-data">
                                  <div className="nf-event__classic-date">
                                    {parts.dayNum && (
                                      <span className="nf-event__classic-num">{parts.dayNum}</span>
                                    )}
                                    <div className="nf-event__classic-meta">
                                      <p className="nf-event__classic-day">{parts.dayName}</p>
                                      {parts.monthYear && (
                                        <p className="nf-event__classic-month">{parts.monthYear}</p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="nf-event__classic-time">{ev.time}</p>
                                  <p className="nf-event__classic-place">{ev.place}</p>
                                  <a
                                    className="nf-event__classic-maps"
                                    href={ev.mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Maps Lokasi Acara
                                  </a>
                                </div>
                              </div>
                            </article>
                          </Reveal>
                        )
                      }
                      if (layout.eventsVariant === 'split') {
                        return (
                          <Reveal key={ev.title} anim="fade-up" delay={i * 100} duration={2000}>
                            <article className="nf-event nf-event--split">
                              <div
                                className="nf-event__media"
                                style={{ backgroundImage: `url(${bg})` }}
                              >
                                <a
                                  className="nf-event__maps-btn"
                                  href={ev.mapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Maps Lokasi Acara
                                </a>
                              </div>
                              <div className="nf-event__body">
                                <h3 className="nf-event__name">{ev.title}</h3>
                                <p className="nf-event__date">{ev.date}</p>
                                <p className="nf-event__time">{ev.time}</p>
                                <p className="nf-event__place">{ev.place}</p>
                              </div>
                            </article>
                          </Reveal>
                        )
                      }
                      return (
                        <Reveal key={ev.title} anim="fade-up" delay={i * 120} duration={2200}>
                          <article
                            className="nf-event"
                            style={{ backgroundImage: `url(${bg})` }}
                          >
                            <div className="nf-event__overlay" />
                            <div className="nf-event__body">
                              <h3>{ev.title}</h3>
                              <p>{ev.date}</p>
                              <p>{ev.time}</p>
                              <p>{ev.place}</p>
                              <a href={ev.mapsUrl} target="_blank" rel="noreferrer">
                                Maps Lokasi Acara
                              </a>
                            </div>
                          </article>
                        </Reveal>
                      )
                    })}
                  </div>
                  <Reveal anim="zoom-in" delay={80} duration={2000}>
                    <p className="nf-hope">{data.closingHope}</p>
                  </Reveal>
                  {layout.mapsEmbed && data.mapsEmbedUrl && (
                    <Reveal anim="zoom-in" duration={2000}>
                      <div className="nf-maps-embed">
                        <iframe
                          title="Lokasi acara"
                          src={data.mapsEmbedUrl}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>
                    </Reveal>
                  )}
                </SlotChrome>

                <SlotChrome
                  sectionId="story"
                  className="nf-section nf-section--story"
                  {...sectionSlotProps(visual.sections.story)}
                >
                  <Reveal anim="fade-up" duration={2000}>
                    <h2 className="nf-title">{data.story.title}</h2>
                    {data.story.subtitle && (
                      <p className="nf-story__subtitle">{data.story.subtitle}</p>
                    )}
                  </Reveal>
                  {data.story.items.map((item, i) => {
                    const storyImg =
                      ('image' in item && typeof item.image === 'string' && item.image) ||
                      data.gallery[i] ||
                      data.coverPhoto ||
                      ''
                    if (layout.storyVariant === 'lux') {
                      return (
                        <Reveal
                          key={item.title}
                          anim={i % 2 === 0 ? 'fade-left' : 'fade-right'}
                          delay={i * 80}
                          duration={2200}
                        >
                          <article className="nf-story nf-story--lux">
                            <div
                              className="nf-story__media"
                              style={{ backgroundImage: `url(${storyImg})` }}
                            >
                              <div className="nf-story__media-overlay" aria-hidden />
                            </div>
                            <div className="nf-story__body">
                              <h3>{item.title}</h3>
                              {item.date && <p className="nf-story__date">{item.date}</p>}
                              <p>{item.text}</p>
                            </div>
                          </article>
                        </Reveal>
                      )
                    }
                    return (
                      <Reveal key={item.title} anim="fade-up" delay={i * 140} duration={2200}>
                        <article className="nf-story">
                          <h3>{item.title}</h3>
                          {item.date && <p className="nf-story__date">{item.date}</p>}
                          <p>{item.text}</p>
                        </article>
                      </Reveal>
                    )
                  })}
                  {layout.galleryAfterStory && (
                    <div className="nf-story-gallery">
                      <Reveal anim="fade-up" duration={2000}>
                        <h2 className="nf-title">Our Gallery</h2>
                      </Reveal>
                      {youtubeEmbed && (
                        <Reveal anim="fade-up" duration={2000}>
                          <div className="nf-youtube">
                            <iframe
                              title="Video undangan"
                              src={youtubeEmbed}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </Reveal>
                      )}
                      <div className="nf-gallery nf-gallery--story">
                        {data.gallery.map((src, i) => (
                          <Reveal
                            key={src}
                            anim={
                              layout.galleryAnim === 'alternate'
                                ? i % 2 === 0
                                  ? 'fade-right'
                                  : 'fade-left'
                                : 'zoom-in'
                            }
                            delay={i * 60}
                            duration={1000}
                          >
                            <button type="button" onClick={() => setLightbox(src)}>
                              <SafeImage src={src} alt="Galeri" />
                            </button>
                          </Reveal>
                        ))}
                      </div>
                    </div>
                  )}
                </SlotChrome>

                <SlotChrome
                  sectionId="timeline"
                  className={
                    layout.timelineOnStoryBg
                      ? 'nf-section nf-section--story nf-section--venue'
                      : layout.timelineVariant === 'conference'
                        ? 'nf-section nf-section--gift nf-section--venue'
                        : 'nf-section nf-section--muted'
                  }
                  {...sectionSlotProps(
                    layout.timelineOnStoryBg
                      ? visual.sections.story
                      : layout.timelineVariant === 'conference'
                        ? visual.sections.gift
                        : visual.sections.timeline,
                  )}
                >
                  <Reveal anim="fade-up" duration={2000}>
                    <h2 className="nf-title nf-title--susunan">Susunan Acara</h2>
                  </Reveal>
                  {layout.timelineVariant === 'conference' ? (
                    <div className="nf-conference">
                      <div className="nf-conference__cap nf-conference__cap--start" />
                      <div className="nf-conference__line" aria-hidden />
                      <div className="nf-conference__content">
                        {data.timeline.map((item, i) => {
                          const timeLabel = item.start || item.end || ''
                          const contentLeft = i % 2 === 0
                          const showIcon = i > 0
                          const descLines = item.desc
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                          const copyBlock = (
                            <div className="nf-conference__copy">
                              <p className="nf-conference__title">{item.title}</p>
                              <hr className="nf-conference__rule" />
                              <p className="nf-conference__desc">
                                {descLines.map((line, li) => (
                                  <span key={li}>
                                    {line}
                                    {li < descLines.length - 1 ? ',' : ''}
                                    {li < descLines.length - 1 && <br />}
                                  </span>
                                ))}
                              </p>
                            </div>
                          )
                          const timeBlock = (
                            <p
                              className={`nf-conference__time${
                                showIcon ? ' nf-conference__time--with-icon' : ''
                              }`}
                            >
                              {timeLabel}
                              {showIcon && (
                                <span className="nf-conference__icon" aria-hidden>
                                  <svg viewBox="0 0 24 24" width="28" height="28">
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="8"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                    />
                                    <circle cx="12" cy="12" r="2.2" fill="currentColor" />
                                  </svg>
                                </span>
                              )}
                            </p>
                          )
                          return (
                            <article key={item.title} className="nf-conference__article">
                              <div className="nf-conference__col nf-conference__col--left">
                                <Reveal anim="fade-right" duration={1800}>
                                  {contentLeft ? copyBlock : timeBlock}
                                </Reveal>
                              </div>
                              <div className="nf-conference__col nf-conference__col--right">
                                <Reveal anim="fade-left" duration={1800}>
                                  {contentLeft ? timeBlock : copyBlock}
                                </Reveal>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                      <div className="nf-conference__cap nf-conference__cap--end" />
                    </div>
                  ) : (
                    <ol className="nf-timeline">
                      {data.timeline.map((item, i) => (
                        <Reveal
                          key={item.title}
                          anim="fade-left"
                          delay={i * 100}
                          duration={2000}
                          as="li"
                        >
                          <strong>{item.title}</strong>
                          <p>{item.desc}</p>
                          {(item.start || item.end) && (
                            <p className="nf-timeline__time">
                              {[item.start, item.end].filter(Boolean).join(' — ')}
                            </p>
                          )}
                      </Reveal>
                    ))}
                    </ol>
                  )}
                </SlotChrome>

                <SlotChrome
                  sectionId="gift"
                  className={`nf-section nf-section--gift${
                    layout.giftVariant === 'cards' ? ' nf-section--gift-cards' : ''
                  }`}
                  {...sectionSlotProps(visual.sections.gift)}
                >
                  {layout.galleryBeforeGift && (
                    <div className="nf-venue-gallery">
                      <Reveal anim="fade-up" duration={2000}>
                        <h2 className="nf-title nf-title--gallery">Our Gallery</h2>
                      </Reveal>
                      {youtubeEmbed && (
                        <Reveal anim="fade-up" duration={2000}>
                          <div className="nf-youtube">
                            <iframe
                              title="Video undangan"
                              src={youtubeEmbed}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </Reveal>
                      )}
                      <div className="nf-gallery">
                        {data.gallery.map((src, i) => (
                          <Reveal
                            key={src}
                            anim={
                              layout.galleryAnim === 'alternate'
                                ? i % 2 === 0
                                  ? 'fade-right'
                                  : 'fade-left'
                                : 'zoom-in'
                            }
                            delay={i * 60}
                            duration={1000}
                          >
                            <button type="button" onClick={() => setLightbox(src)}>
                              <SafeImage src={src} alt="Galeri" />
                            </button>
                          </Reveal>
                        ))}
                      </div>
                    </div>
                  )}
                  {layout.showProtocolNote && data.protocolNote && (
                    <Reveal anim="zoom-out" duration={2000}>
                      <p className="nf-protocol">{data.protocolNote}</p>
                    </Reveal>
                  )}
                  <Reveal anim="fade-up" duration={2000}>
                    <h2 className="nf-title nf-title--gift">Titip Hadiah</h2>
                  </Reveal>
                  <Reveal anim="fade-up" duration={2000}>
                    <div className="nf-gift-intro">
                      <p>{data.gift.intro}</p>
                      {layout.giftVariant === 'cards' && (
                        <p className="nf-gift-intro__note">
                          Note: Terdapat pilihan untuk menyembunyikan daftar rekening, dan akan
                          muncul ketika klik tombol
                        </p>
                      )}
                    </div>
                  </Reveal>
                  {layout.giftVariant === 'toggle' && (
                    <button
                      type="button"
                      className="nf-btn nf-btn--pill"
                      onClick={() => setGiftOpen((v) => !v)}
                    >
                      {giftOpen ? 'Sembunyikan Rekening' : 'Tampilkan Rekening'}
                    </button>
                  )}
                  {(layout.giftVariant === 'cards' || giftOpen) && (
                    <div
                      className={
                        layout.giftVariant === 'cards'
                          ? 'nf-accounts nf-accounts--soft'
                          : 'nf-accounts'
                      }
                    >
                      {data.gift.accounts.map((acc, i) => (
                        <Reveal key={acc.number} anim="fade-up" delay={i * 80} duration={1800}>
                          {layout.giftVariant === 'cards' ? (
                            <div className="nf-rek">
                              <div className="nf-rek__logo" aria-hidden>
                                <span>{acc.bank}</span>
                              </div>
                              <div className="nf-rek__body">
                                <svg
                                  className="nf-rek__pin"
                                  viewBox="0 0 24 24"
                                  width="36"
                                  height="36"
                                  aria-hidden
                                >
                                  <path
                                    fill="currentColor"
                                    d="M12 2c-3.3 0-6 2.6-6 5.8 0 4.4 6 11.2 6 11.2s6-6.8 6-11.2C18 4.6 15.3 2 12 2zm0 8.2a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8z"
                                  />
                                </svg>
                                <p className="nf-rek__norek">{acc.number}</p>
                                <p className="nf-rek__an">{acc.name}</p>
                              </div>
                              <div className="nf-rek__actions">
                                <button type="button" onClick={() => void copy(acc.number)}>
                                  {copied === acc.number ? 'Tersalin' : 'Copy'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="nf-account">
                              <p>{acc.bank}</p>
                              <strong>{acc.number}</strong>
                              <p>{acc.name}</p>
                              <button type="button" onClick={() => void copy(acc.number)}>
                                {copied === acc.number ? 'Tersalin' : 'Copy'}
                              </button>
                            </div>
                          )}
                        </Reveal>
                      ))}
                    </div>
                  )}
                  {layout.showLiveStreaming && data.liveStreaming?.url && (
                    <Reveal anim="fade-up" duration={2000}>
                      <div className="nf-live">
                        <p className="nf-live__note">{data.liveStreaming.note}</p>
                        <a
                          className="nf-btn"
                          href={data.liveStreaming.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Video Live Streaming
                        </a>
                      </div>
                    </Reveal>
                  )}
                </SlotChrome>

                <SlotChrome
                  sectionId="rsvp"
                  className="nf-section nf-section--rsvp"
                  {...sectionSlotProps(visual.sections.rsvp)}
                >
                  <Reveal anim="zoom-out" duration={2000}>
                    <div className="nf-rsvp-wrap">
                      <Reveal anim="fade-up" duration={2000}>
                        <h2 className="nf-title">Kehadiran</h2>
                      </Reveal>
                      {rsvpDone ? (
                        <p className="nf-success">Konfirmasi terkirim. Terima kasih!</p>
                      ) : (
                        <form
                          className="nf-form"
                          onSubmit={(e) => {
                            e.preventDefault()
                            setRsvpDone(true)
                          }}
                        >
                          <label>
                            Nama
                            <input name="nama" required maxLength={20} />
                          </label>
                          <label>
                            Ucapan
                            <textarea name="ucapan" rows={4} />
                          </label>
                          <label>
                            Kehadiran
                            <select name="hadir" defaultValue="">
                              <option value="" disabled>
                                Option
                              </option>
                              <option value="0">Tidak Hadir</option>
                              <option value="1">Hadir</option>
                            </select>
                          </label>
                          {(data.rsvp?.guestCountOptions?.length ?? 0) > 0 && (
                            <label>
                              Jumlah Orang yang Hadir
                              <select name="jumlah" defaultValue={String(data.rsvp.guestCountOptions[0])}>
                                {data.rsvp.guestCountOptions.map((n) => (
                                  <option key={n} value={n}>
                                    {n} Orang
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          <label>
                            Dateng Sama Siapa?
                            <input name="companion" maxLength={40} />
                          </label>
                          {(data.rsvp?.menuOptions?.length ?? 0) > 0 && (
                            <label>
                              Menu Makan Malam
                              <select name="menu" defaultValue="">
                                <option value="">Option</option>
                                {data.rsvp.menuOptions.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          <button type="submit" className="nf-btn">
                            Kirim
                          </button>
                        </form>
                      )}
                    </div>
                  </Reveal>
                </SlotChrome>

                {!layout.galleryAfterStory && !layout.galleryBeforeGift && (
                  <SlotChrome
                    sectionId="gallery"
                    className="nf-section nf-section--gallery"
                    {...sectionSlotProps(visual.sections.gallery)}
                  >
                    <Reveal anim="fade-up" duration={2000}>
                      <h2 className="nf-title">Our Gallery</h2>
                    </Reveal>
                    <div className="nf-gallery">
                      {data.gallery.map((src, i) => (
                        <Reveal key={src} anim="zoom-in" delay={i * 60} duration={1800}>
                          <button type="button" onClick={() => setLightbox(src)}>
                            <SafeImage src={src} alt="Galeri" />
                          </button>
                        </Reveal>
                      ))}
                    </div>
                  </SlotChrome>
                )}

                <SlotChrome
                  sectionId="footer"
                  as="footer"
                  className="nf-footer"
                  {...sectionSlotProps(visual.sections.footer)}
                >
                  {(layout.thankVariant === 'photo-pill' ||
                    layout.thankVariant === 'photo-rect' ||
                    layout.thankVariant === 'photo-arch' ||
                    layout.thankVariant === 'photo-arch-top') && (
                    <Reveal anim="zoom-in" duration={2000}>
                      <div
                        className={
                          layout.thankVariant === 'photo-rect'
                            ? 'nf-thank-photo nf-thank-photo--rect'
                            : layout.thankVariant === 'photo-arch'
                              ? 'nf-thank-photo nf-thank-photo--arch'
                              : layout.thankVariant === 'photo-arch-top'
                                ? 'nf-thank-photo nf-thank-photo--arch-top'
                                : 'nf-thank-photo'
                        }
                        style={
                          layout.thankVariant === 'photo-rect' ||
                          layout.thankVariant === 'photo-arch' ||
                          layout.thankVariant === 'photo-arch-top'
                            ? {
                                backgroundImage: `url(${data.gallery[1] || data.coverPhoto || ''})`,
                              }
                            : {
                                ...photoStyle,
                                backgroundImage: `url(${data.gallery[1] || data.coverPhoto || ''})`,
                                margin: '25px auto 1.25rem',
                              }
                        }
                        role="img"
                        aria-label="Foto penutup"
                      />
                    </Reveal>
                  )}
                  <Reveal anim="fade-down" duration={2000}>
                    <h2>
                      {data.groomNickname} & {data.brideNickname}
                    </h2>
                  </Reveal>
                  <Reveal anim="fade-up" duration={2000}>
                    <p>{data.thanks}</p>
                  </Reveal>
                </SlotChrome>

              </main>
            )}

            <MusicPlayer
              src={data.musicUrl}
              active={previewMode || isOpen}
              accent={skin.colors.secondary}
            />
          </div>
        </RevealRootProvider>
      </div>

      {lightbox && (
        <div className="nf-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  )
}
