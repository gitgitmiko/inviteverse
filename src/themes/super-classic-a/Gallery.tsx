import { useState } from 'react'
import Reveal from './Reveal'

type Props = { images: string[] }

export default function Gallery({ images }: Props) {
  const [active, setActive] = useState<string | null>(null)

  return (
    <section className="section gallery">
      <Reveal anim="zoom-in">
        <h2 className="script-title">Our Gallery</h2>
      </Reveal>
      <div className="gallery__grid">
        {images.map((src, i) => (
          <Reveal key={src} anim="zoom-in" delay={i * 60}>
            <button
              type="button"
              className="gallery__item"
              onClick={() => setActive(src)}
            >
              <img src={src} alt="Galeri undangan" loading="lazy" />
            </button>
          </Reveal>
        ))}
      </div>
      {active && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <img src={active} alt="Preview galeri" className="lightbox__img" />
          <button type="button" className="lightbox__close">
            Tutup
          </button>
        </div>
      )}
    </section>
  )
}
