import type { ThemeId } from '../lib/themeTypes'
import { getNatureSkin, isNatureThemeId } from '../themes/nature-family/natureSkins'
import './ThemePhoneThumb.css'

const FALLBACK: Record<
  string,
  { bg: string; overlay: string; name: string; font: string; align: 'end' | 'center' }
> = {
  'super-classic': {
    bg: 'linear-gradient(160deg, #f7f1e8, #e8dcc8)',
    overlay: 'linear-gradient(180deg, transparent 40%, #7a2f3d99 100%)',
    name: '#7a2f3d',
    font: "'Great Vibes', cursive",
    align: 'end',
  },
  'elegan-grey': {
    bg: 'linear-gradient(160deg, #3a3a3a, #8a8074)',
    overlay: 'linear-gradient(180deg, #00000044 20%, #000000aa 90%)',
    name: '#ffffff',
    font: "'Playfair Display', Georgia, serif",
    align: 'center',
  },
  'blue-flowers': {
    bg: 'linear-gradient(160deg, #e8f4fa, #005189)',
    overlay: 'linear-gradient(180deg, transparent 30%, #003a66cc 95%)',
    name: '#ffffff',
    font: "'Great Vibes', cursive",
    align: 'center',
  },
}

type Props = {
  themeId: ThemeId
  label: string
  index: number
}

/** Mini cover dalam bingkai HP — gaya list “Tema Lain” Indoinvite. */
export default function ThemePhoneThumb({ themeId, label, index }: Props) {
  const skin = isNatureThemeId(themeId) ? getNatureSkin(themeId) : null
  const fb = FALLBACK[themeId]

  const overlay = skin?.cover.overlay ?? fb?.overlay ?? 'linear-gradient(180deg,#0003,#0009)'
  const nameColor = skin
    ? skin.cover.nameColor === 'heading'
      ? skin.colors.heading
      : skin.colors.other
    : (fb?.name ?? '#fff')
  const font = skin?.fonts.display ?? fb?.font ?? "'Dancing Script', cursive"
  const align = skin?.cover.align ?? fb?.align ?? 'center'
  const secondary = skin?.colors.secondary ?? '#2f5d4a'
  const bg = skin
    ? `linear-gradient(165deg, ${skin.colors.primary}, ${skin.colors.secondary})`
    : (fb?.bg ?? 'linear-gradient(160deg,#eee,#ccc)')

  const orns = skin?.coverOrnaments?.slice(0, 2) ?? []

  return (
    <div className="phone-thumb" aria-hidden>
      <div className="phone-thumb__bezel">
        <div className="phone-thumb__notch" />
        <div
          className={`phone-thumb__screen phone-thumb__screen--${align}`}
          style={{ backgroundImage: bg }}
        >
          <div
            className="phone-thumb__overlay"
            style={{ backgroundImage: overlay }}
          />
          {orns.map((src, i) => (
            <img
              key={i}
              className={`phone-thumb__orn phone-thumb__orn--${i + 1}`}
              src={src}
              alt=""
              loading="lazy"
            />
          ))}
          <div className="phone-thumb__content">
            <p className="phone-thumb__eyebrow" style={{ color: nameColor }}>
              Happy Wedding
            </p>
            <p
              className="phone-thumb__names"
              style={{ color: nameColor, fontFamily: font }}
            >
              Justin &amp; Sisca
            </p>
            {skin?.cover.photo && (
              <div
                className="phone-thumb__photo"
                style={{
                  borderRadius: skin.cover.photo.borderRadius,
                  borderColor: skin.colors.other,
                  outlineColor: skin.colors.secondary,
                }}
              />
            )}
            <span
              className="phone-thumb__cta"
              style={{ background: secondary, color: '#fff' }}
            >
              Buka
            </span>
          </div>
        </div>
      </div>
      <span className="phone-thumb__caption">
        {index}. {label}
      </span>
    </div>
  )
}
