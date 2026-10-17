import { CHECKPOINTS } from '@/lib/wanderer/checkpoints';
import type { ViewModel } from '@/lib/wanderer/viewModel';
import { labels } from './labels';
export function CheckpointBar({
  view,
  goTo,
}: {
  view: ViewModel;
  goTo: (index: number) => void;
}) {
  const text = labels();
  return (
    <nav
      className="checkpoint-bar"
      aria-label={text.checkpoints}
      hidden={!view.ready || view.error}
    >
      {CHECKPOINTS.map((checkpoint, index) => (
        <button
          key={checkpoint.label}
          type="button"
          aria-current={view.checkpoint === index ? 'location' : undefined}
          onClick={(event) => {
            goTo(index);
            event.currentTarget.blur();
          }}
        >
          {checkpoint.label}
        </button>
      ))}
    </nav>
  );
}
