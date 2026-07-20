import type { ThemeStyle } from '../../lib/invitationStore'
import SafeImage from '../../components/SafeImage'

type OrnamentKey = keyof ThemeStyle['ornaments']

const SVG_CORNERS: { key: OrnamentKey; className: string; path: string }[] = [
  {
    key: 'topLeft',
    className: 'ornament ornament--tl goyang-1',
    path: 'M10 20 C30 10, 50 8, 70 18 C55 25, 40 35, 28 55 C22 40, 16 30, 10 20 Z M20 70 C35 55, 55 45, 80 42 C60 58, 45 75, 38 100 C30 85, 24 78, 20 70 Z',
  },
  {
    key: 'topRight',
    className: 'ornament ornament--tr goyang-12',
    path: 'M110 20 C90 10, 70 8, 50 18 C65 25, 80 35, 92 55 C98 40, 104 30, 110 20 Z M100 70 C85 55, 65 45, 40 42 C60 58, 75 75, 82 100 C90 85, 96 78, 100 70 Z',
  },
  {
    key: 'bottomLeft',
    className: 'ornament ornament--bl goyang-1',
    path: 'M10 100 C30 110, 50 112, 70 102 C55 95, 40 85, 28 65 C22 80, 16 90, 10 100 Z M20 50 C35 65, 55 75, 80 78 C60 62, 45 45, 38 20 C30 35, 24 42, 20 50 Z',
  },
  {
    key: 'bottomRight',
    className: 'ornament ornament--br goyang-12',
    path: 'M110 100 C90 110, 70 112, 50 102 C65 95, 80 85, 92 65 C98 80, 104 90, 110 100 Z M100 50 C85 65, 65 75, 40 78 C60 62, 75 45, 82 20 C90 35, 96 42, 100 50 Z',
  },
]

type Props = { themeStyle?: ThemeStyle }

export function CornerOrnaments({ themeStyle }: Props) {
  const mode = themeStyle?.ornamentMode ?? 'svg'
  const images = themeStyle?.ornaments

  if (mode === 'image') {
    return (
      <>
        {SVG_CORNERS.map(({ key, className }) => {
          const src = images?.[key]
          if (!src) return null
          return (
            <SafeImage
              key={key}
              className={`${className} ornament--img`}
              src={src}
              alt=""
            />
          )
        })}
      </>
    )
  }

  return (
    <>
      {SVG_CORNERS.map(({ key, className, path }) => (
        <svg key={key} className={className} viewBox="0 0 120 120" aria-hidden>
          <path d={path} fill="currentColor" opacity="0.85" />
        </svg>
      ))}
    </>
  )
}

export function FloatingPetals({ enabled = true }: { enabled?: boolean }) {
  if (!enabled) return null
  return (
    <div className="petals" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className={`petal petal--${i + 1}`} />
      ))}
    </div>
  )
}

export function FlourishDivider() {
  return (
    <div className="flourish" aria-hidden>
      <span />
      <svg viewBox="0 0 40 20" width="40" height="20" className="naik-turun">
        <path
          d="M2 10 Q10 2, 20 10 Q30 18, 38 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle cx="20" cy="10" r="2.5" fill="currentColor" />
      </svg>
      <span />
    </div>
  )
}
