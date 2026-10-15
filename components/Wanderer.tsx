'use client';
import WandererEngine from '@/lib/WandererEngine';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { HeaderSettings } from './wanderer/HeaderSettings';
import { LoadingOverlay } from './wanderer/LoadingOverlay';
import { MovementControls } from './wanderer/MovementControls';
import { StoryCard } from './wanderer/StoryCard';
import { labels } from './wanderer/labels';

export default function Wanderer() {
  const engineRef = useRef<WandererEngine | null>(null);
  if (!engineRef.current) engineRef.current = new WandererEngine();
  const engine = engineRef.current;
  const view = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getServerSnapshot,
  );
  const root = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    card = useRef<HTMLDivElement>(null),
    prompt = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (canvas.current && root.current)
      engine.start(canvas.current, {
        root: root.current,
        card: card.current,
        prompt: prompt.current,
      });
    return () => engine.dispose();
  }, [engine]);
  const text = labels();
  return (
    <div ref={root} className="wanderer">
      <div className="scene-rule" />
      <canvas ref={canvas} className="scene-canvas" aria-label={text.scene} />
      <StoryCard
        view={view}
        elementRef={card}
        collapse={engine.collapseCard}
        interact={engine.interact}
      />
      <div
        ref={prompt}
        className="car-prompt"
        hidden={!view.carPrompt}
        aria-live="polite"
      >
        <span className="prompt-key">
          {view.carPrompt === 'drive' ? 'D' : text.actionKey}
        </span>
        <span>
          {view.carPrompt === 'drive'
            ? text.drive
            : view.carPrompt === 'exit'
              ? text.exit
              : text.enter}
        </span>
      </div>
      <LoadingOverlay view={view} skip={engine.skipIntro} />
      <HeaderSettings view={view} toggleSound={engine.toggleSound} />
      <MovementControls
        view={view}
        hold={engine.hold}
        release={engine.release}
        interact={engine.interact}
      />
      {view.error && (
        <div role="alert" className="scene-fallback">
          {text.fallback}
        </div>
      )}
    </div>
  );
}
