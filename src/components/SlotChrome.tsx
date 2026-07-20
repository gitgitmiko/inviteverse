import type { CSSProperties, ReactNode } from 'react'
import SafeImage from './SafeImage'
import {
  freeOrnamentStyle,
  slotBackgroundStyle,
  slotTransformStyle,
} from '../lib/themeStyle'
import type {
  FreeOrnament,
  OrnamentAnim,
  SectionVisual,
  SlotBackground,
  SlotTransform,
} from '../lib/themeTypes'
import './slotChrome.css'

/** Satu ornamen bebas — posisi dari center section via transform admin */
export function FreeOrnamentItem({
  ornament,
}: {
  ornament: FreeOrnament
}) {
  if (!ornament.src) return null
  const anim = ornament.anim ?? 'none'
  const animClass =
    anim !== 'none' ? `slot-chrome__orn--anim-${anim}` : ''

  return (
    <div
      className="slot-chrome__free-orn"
      style={freeOrnamentStyle(ornament.transform, {
        flipX: ornament.flipX,
        flipY: ornament.flipY,
      })}
      aria-hidden
    >
      <div className={`slot-chrome__orn-motion ${animClass}`}>
        <SafeImage src={ornament.src} alt="" />
      </div>
    </div>
  )
}

export function FreeOrnamentsLayer({
  ornaments,
}: {
  ornaments?: FreeOrnament[] | null
}) {
  const list = (ornaments ?? []).filter((o) => o.src)
  if (!list.length) return null
  return (
    <>
      {list.map((ornament) => (
        <FreeOrnamentItem key={ornament.id} ornament={ornament} />
      ))}
    </>
  )
}

type Props = {
  className?: string
  background?: SlotBackground
  fallbackBg?: string
  ornaments?: FreeOrnament[]
  textColor?: string
  children: ReactNode
  as?: 'section' | 'div' | 'footer' | 'header'
  /** Marker untuk auto-scroll preview editor */
  sectionId?: string
}

/** Wrapper section: background + ornamen bebas dari admin */
export function SlotChrome({
  className = '',
  background,
  fallbackBg,
  ornaments,
  textColor,
  children,
  as: Tag = 'section',
  sectionId,
}: Props) {
  const style: CSSProperties = {
    ...slotBackgroundStyle(background, fallbackBg),
    ...(textColor ? { color: textColor } : {}),
  }

  return (
    <Tag
      className={`slot-chrome ${className}`}
      style={style}
      data-section={sectionId || undefined}
    >
      <FreeOrnamentsLayer ornaments={ornaments} />
      <div className="slot-chrome__body">{children}</div>
    </Tag>
  )
}

export function sectionSlotProps(section: SectionVisual, fallbackBg?: string) {
  return {
    background: section.background,
    fallbackBg,
    ornaments: section.ornaments ?? [],
    textColor: section.textColor || undefined,
  }
}

/** Bingkai foto custom; jika kosong, children (default tema) ditampilkan */
export function PhotoFrameSlot({
  frameSrc,
  frameTransform,
  className = '',
  children,
}: {
  frameSrc?: string
  frameTransform?: SlotTransform | null
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`photo-frame-slot ${className}`}>
      {children}
      {frameSrc ? (
        <SafeImage
          className="photo-frame-slot__overlay"
          src={frameSrc}
          alt=""
          style={slotTransformStyle(frameTransform)}
        />
      ) : null}
    </div>
  )
}

/** @deprecated gunakan FreeOrnamentItem — tetap untuk kompatibilitas singkat */
export function OrnamentImage({
  src,
  anim = 'none',
  transform,
}: {
  src: string
  position?: 'top' | 'bottom'
  anim?: OrnamentAnim
  transform?: SlotTransform | null
}) {
  return (
    <FreeOrnamentItem
      ornament={{
        id: 'legacy',
        src,
        anim: anim ?? 'none',
        transform: {
          offsetX: transform?.offsetX ?? 0,
          offsetY: transform?.offsetY ?? 0,
          scale: transform?.scale ?? 1,
          rotate: transform?.rotate ?? 0,
        },
        flipX: false,
        flipY: false,
      }}
    />
  )
}
