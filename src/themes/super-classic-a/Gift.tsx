import { useState } from 'react'
import type data from '../../data/invitation.json'
import Reveal from './Reveal'

type Props = { gift: (typeof data)['gift'] }

export default function Gift({ gift }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number)
      setCopied(number)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  return (
    <section className="section gift">
      <Reveal anim="zoom-in">
        <h2 className="script-title">Titip Hadiah</h2>
      </Reveal>
      <Reveal anim="fade-up">
        <p className="gift__intro">{gift.intro}</p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? 'Sembunyikan Rekening' : 'Tampilkan Nomor Rekening'}
        </button>
      </Reveal>
      {revealed && (
        <div className="gift__accounts">
          {gift.accounts.map((acc, i) => (
            <Reveal key={acc.number} anim="fade-up" delay={i * 80}>
              <div className="gift__account">
                <p className="gift__bank">{acc.bank}</p>
                <p className="gift__number">{acc.number}</p>
                <p className="gift__name">{acc.name}</p>
                <button type="button" onClick={() => copy(acc.number)}>
                  {copied === acc.number ? 'Tersalin!' : 'Copy'}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
