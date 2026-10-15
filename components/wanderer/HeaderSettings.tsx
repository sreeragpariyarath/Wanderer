import type { ViewModel } from '@/lib/wanderer/viewModel';
import { labels } from './labels';
export function HeaderSettings({
  view,
  toggleSound,
}: {
  view: ViewModel;
  toggleSound: () => void;
}) {
  const text = labels();
  return (
    <header className="scene-header">
      <button
        type="button"
        className="sound-button"
        onClick={toggleSound}
        aria-label={view.sound ? text.mute : text.sound}
        aria-pressed={view.sound}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>
    </header>
  );
}
