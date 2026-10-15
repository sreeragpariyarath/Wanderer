import { describe, it, expect, vi } from 'vitest';
import { SceneAudio } from '../lib/wanderer/audio';
// @vitest-environment jsdom

describe('audio lifetime', () => {
  it('unlocks once, mutes the shared gain immediately, and closes without resurrection', async () => {
    const gainValues: number[] = [];
    const oscillator = {
      type: 'sine',
      frequency: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };
    let resumeResolve: () => void = () => {};
    const context = {
      state: 'suspended',
      currentTime: 0,
      destination: {},
      createGain: () => ({
        gain: {
          value: 1,
          setValueAtTime: (value: number) => gainValues.push(value),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      }),
      createOscillator: () => oscillator,
      resume: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resumeResolve = resolve;
          }),
      ),
      close: vi.fn(async () => {}),
    };
    const constructor = vi.fn(function () {
      return context;
    });
    vi.stubGlobal('AudioContext', constructor);
    const audio = new SceneAudio();
    audio.setEnabled(true);
    audio.play();
    expect(constructor).not.toHaveBeenCalled();
    audio.unlock();
    audio.unlock();
    expect(constructor).toHaveBeenCalledTimes(1);
    context.state = 'running';
    audio.play();
    expect(oscillator.start).toHaveBeenCalledTimes(1);
    audio.setEnabled(false);
    expect(gainValues.at(-1)).toBe(0);
    audio.play();
    expect(oscillator.start).toHaveBeenCalledTimes(1);
    audio.dispose();
    resumeResolve();
    await Promise.resolve();
    audio.setEnabled(true);
    audio.unlock();
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(constructor).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
