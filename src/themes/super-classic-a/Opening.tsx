import type { InvitationData, ThemeStyle } from '../../lib/invitationStore'
import type { SectionFrames, SlotTransform } from '../../lib/themeTypes'
import { PhotoFrameSlot } from '../../components/SlotChrome'
import { CornerOrnaments, FlourishDivider } from './Ornaments'
import Countdown from './Countdown'
import Reveal from './Reveal'
import SafeImage from '../../components/SafeImage'

type Person = InvitationData['groom']

function PersonCard({
  person,
  side,
  frameSrc,
  frameTransform,
}: {
  person: Person
  side: 'groom' | 'bride'
  frameSrc?: string
  frameTransform?: SlotTransform
}) {
  return (
    <article className={`person person--${side}`}>
      <Reveal anim="zoom-in">
        <PhotoFrameSlot frameSrc={frameSrc} frameTransform={frameTransform}>
          <SafeImage
            className="person__photo iizoom"
            src={person.photo}
            alt={person.fullName}
          />
        </PhotoFrameSlot>
      </Reveal>
      <Reveal anim="fade-left" delay={80}>
        <h2 className="person__name">{person.fullName}</h2>
      </Reveal>
      <Reveal anim="fade-right" delay={140}>
        <p className="person__role">{person.parents}</p>
        <p className="person__parents">
          {person.father} & {person.mother}
        </p>
        <p className="person__addr">{person.address}</p>
      </Reveal>
      {person.instagram && (
        <Reveal anim="fade-up" delay={200}>
          <a
            className="person__ig"
            href={`https://instagram.com/${person.instagram}`}
            target="_blank"
            rel="noreferrer"
          >
            @{person.instagram}
          </a>
        </Reveal>
      )}
    </article>
  )
}

type Props = {
  data: InvitationData
  coverPhoto: string
  themeStyle?: ThemeStyle
  frames?: SectionFrames
  framesTransform?: {
    cover?: SlotTransform
    groom?: SlotTransform
    bride?: SlotTransform
  }
  coverFrame?: string
  coverFrameTransform?: SlotTransform
}

export default function Opening({
  data,
  coverPhoto,
  themeStyle,
  frames,
  framesTransform,
  coverFrame,
  coverFrameTransform,
}: Props) {
  return (
    <section className="section opening section--ornamented">
      <CornerOrnaments themeStyle={themeStyle} />

      {/* Hero: foto + judul + countdown */}
      <div data-section="hero" className="opening__anchor opening__anchor--hero">
        <Reveal anim="zoom-in">
          <PhotoFrameSlot
            frameSrc={coverFrame}
            frameTransform={coverFrameTransform}
          >
            <div className="opening__photo-wrap">
              <SafeImage
                className="opening__photo iizoom"
                src={coverPhoto}
                alt="Foto sampul"
              />
              {!coverFrame && (
                <div className="cover__frame opening__frame" aria-hidden />
              )}
            </div>
          </PhotoFrameSlot>
        </Reveal>
        <Reveal anim="zoom-in" delay={100}>
          <h1 className="script-title">{data.eventTitle}</h1>
        </Reveal>
        <FlourishDivider />
        <Reveal anim="fade-up" delay={120}>
          <Countdown target={data.countdownTarget} />
        </Reveal>
      </div>

      {/* Intro: ayat & salam */}
      <div data-section="intro" className="opening__anchor opening__anchor--intro">
        <Reveal anim="fade-up">
          <div className="verse">
            <p className="verse__ar">{data.verse.arabic}</p>
            <p className="verse__tr">{data.verse.translation}</p>
            <p className="verse__src">— {data.verse.source} —</p>
          </div>
        </Reveal>
        <Reveal anim="fade-down">
          <p className="salam">{data.salam}</p>
        </Reveal>
        <Reveal anim="fade-up" delay={80}>
          <p className="intro-text">{data.intro}</p>
        </Reveal>
      </div>

      {/* Mempelai */}
      <div data-section="couple" className="opening__anchor opening__anchor--couple">
        <PersonCard
          person={data.groom}
          side="groom"
          frameSrc={frames?.groom}
          frameTransform={framesTransform?.groom}
        />
        <Reveal anim="zoom-in">
          <p className="ampersand naik-turun">&</p>
        </Reveal>
        <PersonCard
          person={data.bride}
          side="bride"
          frameSrc={frames?.bride}
          frameTransform={framesTransform?.bride}
        />
      </div>
    </section>
  )
}
