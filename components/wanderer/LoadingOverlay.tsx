import type { ViewModel } from '@/lib/wanderer/viewModel';
import { labels } from './labels';
export function LoadingOverlay({
  view,
  skip,
}: {
  view: ViewModel;
  skip: () => void;
}) {
  const text = labels();
  return (
    <div className="loading-overlay" hidden={view.ready || view.error}>
      <span>{text.intro}</span>
      <span className="intro-progress" aria-hidden="true">
        {view.introProgress}%
      </span>
      <button type="button" onClick={skip}>
        {text.skip}
      </button>
    </div>
  );
}
