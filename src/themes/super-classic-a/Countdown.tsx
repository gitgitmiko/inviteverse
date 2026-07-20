import { useEffect, useState } from 'react'

type Props = { target: string }

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function Countdown({ target }: Props) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now())
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLeft({ d, h, m, s })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [target])

  const items = [
    { label: 'Hari', value: left.d },
    { label: 'Jam', value: left.h },
    { label: 'Menit', value: left.m },
    { label: 'Detik', value: left.s },
  ]

  return (
    <div className="countdown">
      {items.map((item) => (
        <div key={item.label} className="countdown__cell">
          <strong>{pad(item.value)}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
