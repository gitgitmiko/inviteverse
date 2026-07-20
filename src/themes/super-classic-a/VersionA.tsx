import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import defaultData from '../../data/invitation.json'
import {
  type InvitationData,
} from '../../lib/invitationStore'
import { resolveGuestNameFromSearch } from '../../lib/guestInvite'
import { getThemeVisual, slotBackgroundStyle, toLegacyThemeStyle } from '../../lib/themeStyle'
import { sectionSlotProps, SlotChrome } from '../../components/SlotChrome'
import {
  useScrollPreviewToSection,
  type PreviewFocusTarget,
} from '../../components/useScrollPreviewToSection'
import Cover from './Cover'
import Opening from './Opening'
import Events from './Events'
import Story from './Story'
import Gallery from './Gallery'
import Timeline from './Timeline'
import Rsvp from './Rsvp'
import Gift from './Gift'
import MusicPlayer from '../../components/MusicPlayer'
import { FloatingPetals } from './Ornaments'
import Reveal, { RevealRootProvider } from './Reveal'
import './super-classic-a.css'

type Props = {
  data?: InvitationData
  forceOpen?: boolean
  hideBack?: boolean
  previewMode?: boolean
  focusSection?: PreviewFocusTarget | null
  focusNonce?: number
}

export default function VersionA({
  data: dataProp,
  forceOpen = false,
  hideBack = false,
  previewMode = false,
  focusSection = null,
  focusNonce = 0,
}: Props) {
  const [params] = useSearchParams()
  const base = (dataProp ?? defaultData) as InvitationData
  const guestName = resolveGuestNameFromSearch(params, base.guestName)
  const [opened, setOpened] = useState(forceOpen)

  const data = useMemo(
    () => ({ ...base, guestName }) as InvitationData,
    [base, guestName],
  )

  const isOpen = forceOpen || opened
  const visual = useMemo(
    () => getThemeVisual(data.themeStyles, 'super-classic'),
    [data],
  )
  const theme = useMemo(() => toLegacyThemeStyle(visual), [visual])
  const colors = visual.colors
  const scrollRootRef = useRef<HTMLDivElement | null>(null)

  useScrollPreviewToSection(
    scrollRootRef,
    focusSection,
    focusNonce,
    focusSection === 'cover' || isOpen,
  )

  const coverBg = slotBackgroundStyle(visual.cover.background, colors.bg)

  const themeVars = {
    '--accent': colors.accent,
    '--gold': colors.gold,
    '--ink': colors.ink,
    '--muted': colors.muted,
    '--bg': colors.bg,
    '--card': colors.card,
    ...coverBg,
  } as CSSProperties

  return (
    <div
      className={`sca ${isOpen ? 'is-open' : ''} ${previewMode ? 'sca--preview' : ''}`}
      style={themeVars}
      data-theme-frame
    >
      {!hideBack && (
        <Link to="/" className="theme-back">
          ← Home
        </Link>
      )}

      <div className="sca__stage">
        <RevealRootProvider rootRef={scrollRootRef}>
          <div className="sca__device" ref={scrollRootRef} style={themeVars}>
            {!isOpen && (
              <Cover
                coverTitle={data.coverTitle}
                groomNickname={data.groomNickname}
                brideNickname={data.brideNickname}
                coverMessage={data.coverMessage}
                guestName={data.guestName}
                coverPhoto={data.coverPhoto}
                themeStyle={theme}
                coverVisual={visual.cover}
                colors={colors}
                onOpen={() => setOpened(true)}
              />
            )}

            {isOpen && (
              <main className="sca__main">
                <FloatingPetals enabled={visual.showPetals !== false} />
                <SlotChrome
                  className="sca-slot"
                  {...sectionSlotProps(visual.sections.hero)}
                >
                  <Opening
                    data={data}
                    coverPhoto={data.coverPhoto}
                    themeStyle={theme}
                    frames={visual.sections.couple.frames}
                    framesTransform={visual.sections.couple.framesTransform}
                    coverFrame={
                      visual.cover.photoFrame ||
                      visual.sections.hero.frames.cover
                    }
                    coverFrameTransform={
                      visual.cover.photoFrame
                        ? visual.cover.photoFrameTransform
                        : visual.sections.hero.framesTransform?.cover
                    }
                  />
                </SlotChrome>
                <SlotChrome
                  sectionId="events"
                  className="sca-slot"
                  {...sectionSlotProps(visual.sections.events)}
                >
                  <Events
                    events={data.events}
                    liveStreaming={data.liveStreaming}
                    closingHope={data.closingHope}
                  />
                </SlotChrome>
                <SlotChrome
                  sectionId="story"
                  className="sca-slot"
                  {...sectionSlotProps(visual.sections.story)}
                >
                  <Story story={data.story} />
                </SlotChrome>
                <SlotChrome
                  sectionId="gallery"
                  className="sca-slot"
                  {...sectionSlotProps(visual.sections.gallery)}
                >
                  <Gallery images={data.gallery} />
                </SlotChrome>
                <SlotChrome
                  sectionId="timeline"
                  className="sca-slot"
                  {...sectionSlotProps(visual.sections.timeline)}
                >
                  <Timeline
                    timeline={data.timeline}
                    protocolNote={data.protocolNote}
                  />
                </SlotChrome>
                <SlotChrome
                  sectionId="rsvp"
                  className="sca-slot"
                  {...sectionSlotProps(visual.sections.rsvp)}
                >
                  <Rsvp rsvp={data.rsvp} />
                </SlotChrome>
                <SlotChrome
                  sectionId="gift"
                  className="sca-slot"
                  {...sectionSlotProps(visual.sections.gift)}
                >
                  <Gift gift={data.gift} />
                </SlotChrome>
                <SlotChrome
                  sectionId="footer"
                  as="footer"
                  className="sca-slot sca__footer"
                  {...sectionSlotProps(visual.sections.footer)}
                >
                  <Reveal anim="zoom-in">
                    <h2 className="script-title">
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
    </div>
  )
}
