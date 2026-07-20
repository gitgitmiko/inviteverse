/** Deteksi & parse sumber musik: file audio langsung atau YouTube. */

export type MusicSource =
  | { kind: 'audio'; url: string }
  | { kind: 'youtube'; videoId: string; url: string }
  | { kind: 'empty' }

export function parseYoutubeVideoId(raw: string): string | null {
  const input = raw.trim()
  if (!input) return null

  try {
    const u = new URL(input)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return v

      const embed = u.pathname.match(/\/embed\/([^/?]+)/)
      if (embed?.[1]) return embed[1]

      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/)
      if (shorts?.[1]) return shorts[1]

      const live = u.pathname.match(/\/live\/([^/?]+)/)
      if (live?.[1]) return live[1]
    }
  } catch {
    // bukan URL absolut
  }

  // ID mentah 11 karakter
  if (/^[\w-]{11}$/.test(input)) return input
  return null
}

export function parseMusicSource(raw: string | undefined | null): MusicSource {
  const url = (raw ?? '').trim()
  if (!url) return { kind: 'empty' }

  const videoId = parseYoutubeVideoId(url)
  if (videoId) return { kind: 'youtube', videoId, url }

  return { kind: 'audio', url }
}
