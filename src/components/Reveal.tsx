import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import './reveal.css'

export type RevealAnim =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-in-up'
  | 'zoom-in-down'
  | 'zoom-out'

type RevealRootCtx = RefObject<Element | null> | null
const RevealRootContext = createContext<RevealRootCtx>(null)

export function RevealRootProvider({
  rootRef,
  children,
}: {
  rootRef: RefObject<Element | null>
  children: ReactNode
}) {
  return (
    <RevealRootContext.Provider value={rootRef}>
      {children}
    </RevealRootContext.Provider>
  )
}

function resolveObserverRoot(candidate: Element | null): Element | null {
  if (!candidate) return null
  // Hanya pakai custom root jika container benar-benar scrollable
  // (mis. frame HP di desktop). Di mobile konten penuh → pakai viewport.
  const el = candidate as HTMLElement
  if (el.scrollHeight > el.clientHeight + 4) return candidate
  return null
}

type Props = {
  children: ReactNode
  anim?: RevealAnim
  delay?: number
  duration?: number
  className?: string
  /** true = animasi sekali saja (untuk sampul). Default false = mirip AOS Indoinvite */
  once?: boolean
  as?: 'div' | 'section' | 'article' | 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'footer'
}

export default function Reveal({
  children,
  anim = 'fade-up',
  delay = 0,
  duration = 1200,
  className = '',
  once = false,
  as: Tag = 'div',
}: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const rootRef = useContext(RevealRootContext)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let io: IntersectionObserver | null = null
    let locked = false

    const observe = () => {
      io?.disconnect()
      const root = resolveObserverRoot(rootRef?.current ?? null)
      // Mirip AOS default (once: false): masuk → animasi, keluar → balik posisi awal
      io = new IntersectionObserver(
        ([entry]) => {
          if (once) {
            if (entry.isIntersecting && !locked) {
              locked = true
              setShown(true)
              io?.unobserve(el)
            }
            return
          }
          setShown(entry.isIntersecting)
        },
        {
          root,
          threshold: 0.15,
          rootMargin: root ? '0px 0px -6% 0px' : '0px 0px -40px 0px',
        },
      )
      io.observe(el)
    }

    observe()
    window.addEventListener('resize', observe)

    return () => {
      io?.disconnect()
      window.removeEventListener('resize', observe)
    }
  }, [rootRef, once])

  return (
    <Tag
      ref={ref as never}
      className={`reveal reveal--${anim} ${shown ? 'is-in' : ''} ${className}`}
      style={{
        // Delay hanya saat masuk; saat keluar langsung kembali ke posisi awal
        transitionDelay: shown ? `${delay}ms` : '0ms',
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </Tag>
  )
}
