import type data from '../../data/invitation.json'
import Reveal from './Reveal'

type Props = {
  timeline: (typeof data)['timeline']
  protocolNote: string
}

export default function Timeline({ timeline, protocolNote }: Props) {
  return (
    <section className="section timeline">
      <Reveal anim="zoom-in">
        <h2 className="script-title">Susunan Acara</h2>
      </Reveal>
      <ol className="timeline__list">
        {timeline.map((item, i) => (
          <Reveal key={item.title} anim="fade-left" delay={i * 90} as="li" className="timeline__item">
            <div className="timeline__dot" />
            <div className="timeline__body">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              {(item.start || item.end) && (
                <p className="timeline__time">
                  {[item.start, item.end].filter(Boolean).join(' — ')}
                </p>
              )}
            </div>
          </Reveal>
        ))}
      </ol>
      <Reveal anim="fade-up">
        <p className="timeline__note">{protocolNote}</p>
      </Reveal>
    </section>
  )
}
