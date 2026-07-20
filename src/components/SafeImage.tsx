import type { CSSProperties } from 'react'

type Props = {
  src: string
  alt?: string
  className?: string
  style?: CSSProperties
}

/** Gambar aman untuk host yang memblokir hotlink (Google Drive, dll). */
export default function SafeImage({ src, alt = '', className, style }: Props) {
  return (
    <img
      className={className}
      style={style}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  )
}
