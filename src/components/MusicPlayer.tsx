import { useEffect, useMemo, useRef, useState } from 'react'
import { parseMusicSource } from '../lib/mediaUrl'
import './musicPlayer.css'

type Props = {
  src: string
  active: boolean
  /** Warna tombol opsional (fallback ke CSS var tema) */
  accent?: string
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string
          width?: number
          height?: number
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (e: { target: YtPlayer }) => void
            onError?: () => void
          }
        },
      ) => YtPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

type YtPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  destroy: () => void
  getPlayerState: () => number
}

let ytApiPromise: Promise<void> | null = null

function loadYoutubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    if (!document.querySelector('script[data-yt-api]')) {
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      s.async = true
      s.dataset.ytApi = '1'
      document.head.appendChild(s)
    }
    if (window.YT?.Player) resolve()
  })
  return ytApiPromise
}

/** Pemutar musik global: YouTube + MP3 — dipakai semua tema */
export default function MusicPlayer({ src, active, accent }: Props) {
  const source = useMemo(() => parseMusicSource(src), [src])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ytHostRef = useRef<HTMLDivElement | null>(null)
  const ytPlayerRef = useRef<YtPlayer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [ytReady, setYtReady] = useState(false)

  const videoId = source.kind === 'youtube' ? source.videoId : null
  const audioUrl = source.kind === 'audio' ? source.url : null

  useEffect(() => {
    if (!audioUrl) return
    const el = audioRef.current
    if (!el || !active) {
      el?.pause()
      setPlaying(false)
      return
    }
    el.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false))
  }, [active, audioUrl])

  useEffect(() => {
    if (!videoId) {
      ytPlayerRef.current?.destroy()
      ytPlayerRef.current = null
      setYtReady(false)
      return
    }

    let cancelled = false
    const host = ytHostRef.current
    if (!host) return

    void loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return

      ytPlayerRef.current?.destroy()
      ytPlayerRef.current = null
      host.innerHTML = ''
      const mount = document.createElement('div')
      host.appendChild(mount)

      new window.YT.Player(mount, {
        videoId,
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          loop: 1,
          playlist: videoId,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return
            ytPlayerRef.current = e.target
            setYtReady(true)
          },
          onError: () => {
            if (!cancelled) {
              setPlaying(false)
              setYtReady(false)
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      try {
        ytPlayerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      ytPlayerRef.current = null
      setYtReady(false)
      if (host) host.innerHTML = ''
    }
  }, [videoId])

  useEffect(() => {
    if (!videoId || !ytReady) return
    const player = ytPlayerRef.current
    if (!player) return

    if (active) {
      try {
        player.playVideo()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    } else {
      try {
        player.pauseVideo()
      } catch {
        /* ignore */
      }
      setPlaying(false)
    }
  }, [active, ytReady, videoId])

  const toggle = () => {
    if (audioUrl) {
      const el = audioRef.current
      if (!el) return
      if (el.paused) {
        el.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false))
      } else {
        el.pause()
        setPlaying(false)
      }
      return
    }

    if (videoId) {
      const player = ytPlayerRef.current
      if (!player) return
      const playingState = window.YT?.PlayerState?.PLAYING ?? 1
      if (player.getPlayerState() === playingState) {
        player.pauseVideo()
        setPlaying(false)
      } else {
        player.playVideo()
        setPlaying(true)
      }
    }
  }

  if (source.kind === 'empty') return null

  return (
    <>
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} loop preload="none" />
      )}
      {videoId && (
        <div className="music-yt" aria-hidden>
          <div ref={ytHostRef} />
        </div>
      )}
      {active && (
        <button
          type="button"
          className={`music-btn ${playing ? 'is-playing' : ''}`}
          onClick={toggle}
          aria-label={playing ? 'Pause musik' : 'Putar musik'}
          title={videoId ? 'Musik YouTube' : 'Musik audio'}
          style={accent ? { background: accent } : undefined}
        >
          {playing ? '♪' : '♫'}
        </button>
      )}
    </>
  )
}
