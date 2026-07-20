import type data from '../../data/invitation.json'
import { FlourishDivider } from './Ornaments'
import Reveal from './Reveal'

type Props = { story: (typeof data)['story'] }

export default function Story({ story }: Props) {
  return (
    <section className="section story">
      <Reveal anim="zoom-in">
        <h2 className="script-title">{story.title}</h2>
        <p className="section-sub">{story.subtitle}</p>
      </Reveal>
      <FlourishDivider />
      <div className="story__list">
        {story.items.map((item, i) => (
          <Reveal key={item.title} anim="fade-up" delay={i * 120}>
            <article className="story__item">
              <h3>{item.title}</h3>
              {item.date && <p className="story__date">{item.date}</p>}
              <p>{item.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
