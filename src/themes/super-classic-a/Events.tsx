import type data from '../../data/invitation.json'
import Reveal from './Reveal'

type EventItem = (typeof data)['events'][number]

type Props = {
  events: EventItem[]
  liveStreaming: (typeof data)['liveStreaming']
  closingHope: string
}

export default function Events({ events, liveStreaming, closingHope }: Props) {
  return (
    <section className="section events">
      <Reveal anim="zoom-in">
        <h2 className="script-title">Save The Date Acara</h2>
      </Reveal>
      <div className="events__list">
        {events.map((ev, i) => (
          <Reveal key={ev.title} anim="fade-up" delay={i * 100}>
            <article className="event-card">
              <h3>{ev.title}</h3>
              <p className="event-card__date">{ev.date}</p>
              <p>{ev.time}</p>
              <p>{ev.place}</p>
              <a
                className="btn-maps"
                href={ev.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Maps Lokasi Acara
              </a>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal anim="fade-up">
        <p className="events__note">{liveStreaming.note}</p>
        <a
          className="btn-primary btn-primary--outline"
          href={liveStreaming.url}
          target="_blank"
          rel="noreferrer"
        >
          Video Live Streaming
        </a>
        <p className="events__hope">{closingHope}</p>
      </Reveal>
    </section>
  )
}
