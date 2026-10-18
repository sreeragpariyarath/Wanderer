import { CARDS } from '@/lib/wanderer/sceneData';
import type { ViewModel } from '@/lib/wanderer/viewModel';
import type { RefObject } from 'react';
import { labels } from './labels';
export function StoryCard({
  view,
  elementRef,
  collapse,
  interact,
}: {
  view: ViewModel;
  elementRef: RefObject<HTMLDivElement | null>;
  collapse: () => void;
  interact: () => void;
}) {
  const text = labels(),
    card = CARDS[view.cardIndex],
    content = card?.en;
  return (
    <div
      ref={elementRef}
      className="story-card"
      hidden={!view.cardVisible}
      aria-hidden={!view.cardVisible}
      inert={!view.cardVisible}
    >
      <span className="story-kicker">{content?.[0]}</span>
      <span className="story-title">{content?.[1]}</span>
      <span className="story-subtitle">{content?.[2]}</span>
      {view.expanded ? (
        <>
          <p>{content?.[3]}</p>
          {card?.links && card.links.length > 0 && (
            <nav className="story-links" aria-label={`${content?.[1]} links`}>
              {card.links.map(({ label, href }) => (
                <a
                  key={`${label}-${href}`}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {label}
                </a>
              ))}
            </nav>
          )}
          <button type="button" className="story-action" onClick={collapse}>
            {text.close}
          </button>
        </>
      ) : (
        <button type="button" className="story-action" onClick={interact}>
          {text.open} · {text.actionKey}
        </button>
      )}
    </div>
  );
}
