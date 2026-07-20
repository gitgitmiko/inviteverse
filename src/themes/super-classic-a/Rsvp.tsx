import { useState } from 'react'
import type { FormEvent } from 'react'
import type data from '../../data/invitation.json'
import Reveal from './Reveal'

type Props = { rsvp: (typeof data)['rsvp'] }

export default function Rsvp({ rsvp }: Props) {
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    name: '',
    message: '',
    attendance: 'Hadir',
    guests: '1',
    companion: '',
    menu: rsvp.menuOptions[0] ?? '',
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setDone(true)
  }

  if (done) {
    return (
      <section className="section rsvp">
        <Reveal anim="zoom-in">
          <h2 className="script-title">Kehadiran</h2>
          <p className="rsvp__success">
            Konfirmasi kehadiran berhasil dikirim. Terima kasih!
          </p>
          <button
            type="button"
            className="btn-primary--outline btn-primary"
            onClick={() => setDone(false)}
          >
            Reset
          </button>
        </Reveal>
      </section>
    )
  }

  return (
    <section className="section rsvp">
      <Reveal anim="zoom-in">
        <h2 className="script-title">Kehadiran</h2>
      </Reveal>
      <Reveal anim="fade-up" delay={80}>
      <form className="rsvp__form" onSubmit={onSubmit}>
        <label>
          Nama
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Ucapan
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </label>
        <label>
          Kehadiran
          <select
            value={form.attendance}
            onChange={(e) => setForm({ ...form, attendance: e.target.value })}
          >
            <option>Hadir</option>
            <option>Tidak Hadir</option>
          </select>
        </label>
        <label>
          Jumlah Orang yang Hadir
          <select
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: e.target.value })}
          >
            {rsvp.guestCountOptions.map((n) => (
              <option key={n} value={n}>
                {n} Orang
              </option>
            ))}
          </select>
        </label>
        <label>
          Dateng Sama Siapa?
          <input
            value={form.companion}
            onChange={(e) => setForm({ ...form, companion: e.target.value })}
          />
        </label>
        <label>
          Menu Makan Malam
          <select
            value={form.menu}
            onChange={(e) => setForm({ ...form, menu: e.target.value })}
          >
            {rsvp.menuOptions.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary">
          Kirim
        </button>
      </form>
      </Reveal>
    </section>
  )
}
