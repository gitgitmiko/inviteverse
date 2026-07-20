import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import defaultData from '../../data/invitation.json'
import type { InvitationData } from '../../lib/invitationStore'
import { resolveGuestNameFromSearch } from '../../lib/guestInvite'
import { getThemeVisual, slotBackgroundStyle } from '../../lib/themeStyle'
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
import './elegan-grey.css'

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

function FadeHero({ images, intervalMs = 4500 }: { images: string[]; intervalMs?: number }) {
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

  if (!slides.length) return <div className="eg-fade-hero eg-fade-hero--empty" />

  return (
    <div className="eg-fade-hero">
      {slides.map((src, i) => (
        <div
          key={src + i}
          className={`eg-fade-hero__slide ${i === active ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="eg-fade-hero__overlay" />
    </div>
  )
}

function PhotoMarquee({ images }: { images: string[] }) {
  const base = (images.length ? images : []).slice(0, 5)
  // duplikasi agar loop seamless (mirip slide-track Indoinvite)
  const track = [...base, ...base, ...base]

  if (!base.length) return null

  return (
    <div className="eg-marquee">
      <div className="eg-marquee__track">
        {track.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="eg-marquee__slide"
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

  return (
    <div className="eg-count">
      {(
        [
          ['Hari', left.d],
          ['Jam', left.h],
          ['Menit', left.m],
          ['Detik', left.s],
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="eg-count__cell">
          <strong>{pad(value)}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function EleganGrey({
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

  const data = useMemo(
    () => ({ ...base, guestName }) as InvitationData,
    [base, guestName],
  )
  const isOpen = forceOpen || opened
  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const visual = useMemo(
    () => getThemeVisual(data.themeStyles, 'elegan-grey'),
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
    '--eg-ink': colors.ink,
    '--eg-muted': colors.muted,
    '--eg-taupe': colors.accent,
    '--eg-soft': colors.gold,
    '--eg-bg': colors.bg,
  } as CSSProperties
  const coverBg = slotBackgroundStyle(visual.cover.background, colors.bg)
  const tc = visual.cover.textColors
  const coupleFrames = visual.sections.couple.frames

  const heroImages = useMemo(() => {
    const list = [data.coverPhoto, ...data.gallery].filter(Boolean)
    return Array.from(new Set(list))
  }, [data.coverPhoto, data.gallery])

  const marqueeImages = useMemo(() => {
    const list = data.gallery.length ? data.gallery : heroImages
    return list.slice(0, 5)
  }, [data.gallery, heroImages])

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
      className={`eg ${isOpen ? 'is-open' : ''} ${previewMode ? 'eg--preview' : ''}`}
      style={themeVars}
      data-theme-frame
    >
      {!hideBack && (
        <Link to="/" className="theme-back">
          ← Home
        </Link>
      )}

      <div className="eg__stage">
        <RevealRootProvider rootRef={scrollRootRef}>
          <div className="eg__device" ref={scrollRootRef}>
            {!isOpen && (
              <section className="eg-cover" style={coverBg} data-section="cover">
                <FreeOrnamentsLayer ornaments={visual.cover.ornaments} />
                <FadeHero images={heroImages.slice(0, 2)} intervalMs={4000} />
                <div className="eg-cover__inner">
                  <div className="eg-cover__top">
                    <p
                      className="eg-cover__eyebrow"
                      style={tc.eyebrow ? { color: tc.eyebrow } : undefined}
                    >
                      The Wedding Of
                    </p>
                    <h1
                      className="eg-cover__names"
                      style={tc.name ? { color: tc.name } : undefined}
                    >
                      {data.groomNickname} & {data.brideNickname}
                    </h1>
                  </div>
                  <div className="eg-cover__bottom">
                    <p
                      className="eg-cover__to"
                      style={tc.guest ? { color: tc.guest } : undefined}
                    >
                      Kepada
                    </p>
                    <h3
                      className="eg-cover__guest"
                      style={tc.guest ? { color: tc.guest } : undefined}
                    >
                      Yth. {data.guestName}
                    </h3>
                    <p className="eg-cover__msg">{data.coverMessage}</p>
                    <button
                      type="button"
                      className="eg-btn"
                      onClick={() => setOpened(true)}
                      style={{
                        ...(tc.buttonBg ? { background: tc.buttonBg } : {}),
                        ...(tc.buttonText ? { color: tc.buttonText } : {}),
                      }}
                    >
                      ✉ Buka Undangan
                    </button>
                  </div>
                </div>
              </section>
            )}

            {isOpen && (
              <main className="eg__main">
                <SlotChrome
                  sectionId="hero"
                  as="header"
                  className="eg-hero"
                  {...sectionSlotProps(visual.sections.hero)}
                >
                  <FadeHero images={heroImages} intervalMs={5000} />
                  <Reveal anim="zoom-in-down" duration={1200} className="eg-hero__text">
                    <p>The Wedding Of</p>
                    <h1>
                      {data.groomNickname} & {data.brideNickname}
                    </h1>
                    <p className="eg-hero__sub">OUR WEDDING</p>
                  </Reveal>
                </SlotChrome>

                <Reveal anim="fade-up" delay={100}>
                  <PhotoMarquee images={marqueeImages} />
                </Reveal>

                <SlotChrome
                  sectionId="intro"
                  className="eg-section"
                  {...sectionSlotProps(visual.sections.intro)}
                >
                  <Reveal anim="fade-up">
                    <p className="eg-lead">{data.intro}</p>
                    <Countdown target={data.countdownTarget} />
                  </Reveal>
                </SlotChrome>

                <SlotChrome
                  sectionId="couple"
                  className="eg-couple-wrap"
                  {...sectionSlotProps(visual.sections.couple)}
                >
                <Reveal anim="fade-right" as="section" className="eg-couple-row">
                  <div className="eg-couple-row__text">
                    <h2 className="eg-nick">{data.groomNickname}</h2>
                    <h3>{data.groom.fullName}</h3>
                    <p className="eg-rule">------------</p>
                    <p>{data.groom.parents}</p>
                    <p>
                      {data.groom.father} & {data.groom.mother}
                    </p>
                    <p>{data.groom.address}</p>
                    <p className="eg-rule">------------</p>
                    {data.groom.instagram && (
                      <a
                        className="eg-ig"
                        href={`https://instagram.com/${data.groom.instagram}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        @{data.groom.instagram}
                      </a>
                    )}
                  </div>
                  <Reveal anim="fade-left" delay={120} className="eg-couple-row__photo">
                    <PhotoFrameSlot
                      frameSrc={coupleFrames.groom || visual.cover.photoFrame}
                      frameTransform={
                        coupleFrames.groom
                          ? visual.sections.couple.framesTransform?.groom
                          : visual.cover.photoFrameTransform
                      }
                    >
                      {!coupleFrames.groom && (
                        <div className="eg-arch-frame" data-slot="groom-frame" />
                      )}
                      <div className="eg-arch-photo">
                        <SafeImage
                          src={data.groom.photo}
                          alt={data.groom.fullName}
                        />
                      </div>
                    </PhotoFrameSlot>
                  </Reveal>
                </Reveal>

                <Reveal anim="zoom-in" className="eg-name-band">
                  <h2>
                    {data.groomNickname} & {data.brideNickname}
                  </h2>
                </Reveal>

                <Reveal
                  anim="fade-left"
                  as="section"
                  className="eg-couple-row eg-couple-row--reverse"
                >
                  <Reveal anim="fade-right" delay={120} className="eg-couple-row__photo">
                    <PhotoFrameSlot
                      frameSrc={coupleFrames.bride || visual.cover.photoFrame}
                      frameTransform={
                        coupleFrames.bride
                          ? visual.sections.couple.framesTransform?.bride
                          : visual.cover.photoFrameTransform
                      }
                    >
                      {!coupleFrames.bride && (
                        <div className="eg-arch-frame" data-slot="bride-frame" />
                      )}
                      <div className="eg-arch-photo">
                        <SafeImage
                          src={data.bride.photo}
                          alt={data.bride.fullName}
                        />
                      </div>
                    </PhotoFrameSlot>
                  </Reveal>
                  <div className="eg-couple-row__text">
                    <h2 className="eg-nick">{data.brideNickname}</h2>
                    <h3>{data.bride.fullName}</h3>
                    <p className="eg-rule">------------</p>
                    <p>{data.bride.parents}</p>
                    <p>
                      {data.bride.father} & {data.bride.mother}
                    </p>
                    <p>{data.bride.address}</p>
                    <p className="eg-rule">------------</p>
                    {data.bride.instagram && (
                      <a
                        className="eg-ig"
                        href={`https://instagram.com/${data.bride.instagram}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        @{data.bride.instagram}
                      </a>
                    )}
                  </div>
                </Reveal>
                </SlotChrome>

                <SlotChrome sectionId="intro" className="eg-section" {...sectionSlotProps(visual.sections.intro)}>
                  <Reveal anim="fade-up">
                    <p className="eg-kicker">Save The Date</p>
                    <div className="eg-verse">
                      <p className="eg-verse__ar">{data.verse.arabic}</p>
                      <p>{data.verse.translation}</p>
                      <p className="eg-verse__src">— {data.verse.source} —</p>
                    </div>
                  </Reveal>
                </SlotChrome>

                <SlotChrome sectionId="events" className="eg-section" {...sectionSlotProps(visual.sections.events)}>
                  <Reveal anim="zoom-in-up">
                    <h2 className="eg-title">Acara</h2>
                  </Reveal>
                  <div className="eg-events">
                    {data.events.map((ev, i) => (
                      <Reveal key={ev.title} anim="fade-up" delay={i * 100}>
                        <article className="eg-event">
                          <h3>{ev.title}</h3>
                          <p className="eg-event__date">{ev.date}</p>
                          <p>{ev.time}</p>
                          <p>{ev.place}</p>
                          <a href={ev.mapsUrl} target="_blank" rel="noreferrer">
                            Maps Lokasi Acara
                          </a>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                  <Reveal anim="fade-up" delay={80}>
                    <p className="eg-hope">{data.closingHope}</p>
                  </Reveal>
                </SlotChrome>

                <SlotChrome sectionId="story" className="eg-section" {...sectionSlotProps(visual.sections.story)}>
                  <Reveal anim="fade-up">
                    <p className="eg-kicker">Sebuah Kisah</p>
                    <h2 className="eg-title">{data.story.title}</h2>
                  </Reveal>
                  {data.story.items.map((item, i) => (
                    <Reveal key={item.title} anim="fade-up" delay={i * 120}>
                      <article className="eg-story">
                        <h3>{item.title}</h3>
                        {item.date && (
                          <p className="eg-story__date">{item.date}</p>
                        )}
                        <p>{item.text}</p>
                      </article>
                    </Reveal>
                  ))}
                </SlotChrome>

                <SlotChrome sectionId="timeline" className="eg-section" {...sectionSlotProps(visual.sections.timeline)}>
                  <Reveal anim="fade-up">
                    <h2 className="eg-title">Susunan Acara</h2>
                  </Reveal>
                  <ol className="eg-timeline">
                    {data.timeline.map((item, i) => (
                      <Reveal
                        key={item.title}
                        anim="fade-left"
                        delay={i * 90}
                        as="li"
                      >
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                        {(item.start || item.end) && (
                          <p className="eg-timeline__time">
                            {[item.start, item.end].filter(Boolean).join(' — ')}
                          </p>
                        )}
                      </Reveal>
                    ))}
                  </ol>
                </SlotChrome>

                <SlotChrome sectionId="gift" className="eg-section" {...sectionSlotProps(visual.sections.gift)}>
                  <Reveal anim="fade-up">
                    <h2 className="eg-title">Titip Hadiah</h2>
                    <p className="eg-lead">{data.gift.intro}</p>
                  </Reveal>
                  <button
                    type="button"
                    className="eg-btn eg-btn--outline"
                    onClick={() => setGiftOpen((v) => !v)}
                  >
                    {giftOpen ? 'Sembunyikan Rekening' : 'Tampilkan Rekening'}
                  </button>
                  {giftOpen && (
                    <div className="eg-accounts">
                      {data.gift.accounts.map((acc, i) => (
                        <Reveal key={acc.number} anim="fade-up" delay={i * 80}>
                          <div className="eg-account">
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
                </SlotChrome>

                <SlotChrome sectionId="rsvp" className="eg-section" {...sectionSlotProps(visual.sections.rsvp)}>
                  <Reveal anim="fade-up">
                    <h2 className="eg-title">Kehadiran</h2>
                  </Reveal>
                  {rsvpDone ? (
                    <p className="eg-success">
                      Konfirmasi terkirim. Terima kasih!
                    </p>
                  ) : (
                    <form
                      className="eg-form"
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
                      <button type="submit" className="eg-btn">
                        Kirim
                      </button>
                    </form>
                  )}
                </SlotChrome>

                <SlotChrome sectionId="gallery" className="eg-section" {...sectionSlotProps(visual.sections.gallery)}>
                  <Reveal anim="fade-up">
                    <h2 className="eg-title">Our Gallery</h2>
                  </Reveal>
                  <div className="eg-gallery">
                    {data.gallery.map((src, i) => (
                      <Reveal key={src} anim="zoom-in" delay={i * 60}>
                        <button
                          type="button"
                          onClick={() => setLightbox(src)}
                        >
                          <SafeImage src={src} alt="Galeri" />
                        </button>
                      </Reveal>
                    ))}
                  </div>
                </SlotChrome>

                <SlotChrome
                  sectionId="footer"
                  as="footer"
                  className="eg-footer"
                  {...sectionSlotProps(visual.sections.footer)}
                >
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
        <div className="eg-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  )
}
