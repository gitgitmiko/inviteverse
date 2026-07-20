import type { ThemeStyle } from '../../lib/invitationStore'
import type { CoverVisual, ThemeColors } from '../../lib/themeTypes'
import { slotBackgroundStyle } from '../../lib/themeStyle'
import { FreeOrnamentsLayer, PhotoFrameSlot } from '../../components/SlotChrome'
import SafeImage from '../../components/SafeImage'
import { CornerOrnaments, FloatingPetals } from './Ornaments'
import Reveal from './Reveal'

type Props = {
  coverTitle: string
  groomNickname: string
  brideNickname: string
  coverMessage: string
  guestName: string
  coverPhoto: string
  themeStyle?: ThemeStyle
  coverVisual?: CoverVisual
  colors?: ThemeColors
  onOpen: () => void
}

export default function Cover({
  coverTitle,
  groomNickname,
  brideNickname,
  coverMessage,
  guestName,
  coverPhoto,
  themeStyle,
  coverVisual,
  colors,
  onOpen,
}: Props) {
  const tc = coverVisual?.textColors
  const bgStyle = slotBackgroundStyle(
    coverVisual?.background,
    colors?.bg ?? '#f7f1e8',
  )

  return (
    <section className="cover" style={bgStyle} data-section="cover">
      <FreeOrnamentsLayer ornaments={coverVisual?.ornaments} />
      <CornerOrnaments themeStyle={themeStyle} />
      <FloatingPetals enabled={themeStyle?.showPetals !== false} />
      <div className="cover__inner">
        <Reveal anim="fade-down" delay={0} once>
          <h3
            className="cover__label"
            style={tc?.eyebrow ? { color: tc.eyebrow } : undefined}
          >
            {coverTitle}
          </h3>
        </Reveal>
        <Reveal anim="zoom-in" delay={60} once>
          <PhotoFrameSlot
            frameSrc={coverVisual?.photoFrame}
            frameTransform={coverVisual?.photoFrameTransform}
          >
            <div className="cover__photo-wrap">
              <SafeImage
                className="cover__photo iizoom"
                src={coverPhoto}
                alt="Foto sampul"
              />
              {!coverVisual?.photoFrame && (
                <div className="cover__frame" aria-hidden />
              )}
            </div>
          </PhotoFrameSlot>
        </Reveal>
        <Reveal anim="fade-down" delay={100} once>
          <h1
            className="cover__names"
            style={tc?.name ? { color: tc.name } : undefined}
          >
            {groomNickname} & {brideNickname}
          </h1>
        </Reveal>
        <Reveal anim="fade-up" delay={140} once>
          <p className="cover__msg">{coverMessage}</p>
        </Reveal>
        <Reveal anim="fade-up" delay={180} once>
          <p
            className="cover__to"
            style={tc?.guest ? { color: tc.guest } : undefined}
          >
            Kepada
          </p>
          <h3
            className="cover__guest"
            style={tc?.guest ? { color: tc.guest } : undefined}
          >
            Yth. {guestName}
          </h3>
        </Reveal>
        <Reveal anim="zoom-in" delay={220} once>
          <button
            type="button"
            className="btn-primary btn-pulse"
            onClick={onOpen}
            style={{
              ...(tc?.buttonBg ? { background: tc.buttonBg } : {}),
              ...(tc?.buttonText ? { color: tc.buttonText } : {}),
            }}
          >
            ✉ Buka Sampul
          </button>
        </Reveal>
      </div>
    </section>
  )
}
