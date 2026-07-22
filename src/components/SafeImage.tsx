import { useState, type CSSProperties } from 'react'
import { toDirectImageUrl } from '../lib/imageUrl'

type Props = {
  src: string
  alt?: string
  className?: string
  style?: CSSProperties
  /** Paksa eager (untuk ornamen/frame yang sering di dalam overflow:hidden) */
  eager?: boolean
}

/** Gambar aman untuk host yang memblokir hotlink (Google Drive, dll). */
export default function SafeImage({
  src,
  alt = '',
  className,
  style,
  eager = false,
}: Props) {
  const [failed, setFailed] = useState(false)
  const resolved = toDirectImageUrl(src)
  if (!resolved || failed) return null

  const isLocal =
    resolved.startsWith('/') ||
    resolved.startsWith('./') ||
    resolved.startsWith('blob:') ||
    resolved.startsWith('data:')

  return (
    <img
      className={className}
      style={style}
      src={resolved}
      alt={alt}
      loading={eager || isLocal ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy={isLocal ? undefined : 'no-referrer'}
      onError={() => setFailed(true)}
    />
  )
}
