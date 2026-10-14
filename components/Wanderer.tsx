'use client';
import { useEffect, useReducer, useRef } from 'react';
import type { CSSProperties } from 'react';
import WandererEngine from '@/lib/WandererEngine';

const circleBtn: CSSProperties = { width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 17, color: 'var(--color-text)', display: 'grid', placeItems: 'center', padding: 0 };

export default function Wanderer() {
  const ref = useRef<WandererEngine | null>(null);
  if (!ref.current) ref.current = new WandererEngine();
  const engine = ref.current;
  const [, force] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const unsub = engine.subscribe(force);
    engine.componentDidMount();
    return () => { unsub(); engine.componentWillUnmount(); };
  }, [engine]);

  const v = engine.renderVals();

  return (
    <div ref={v.rootRef} style={{ position: 'fixed', inset: 0, background: 'var(--color-bg)', fontFamily: 'var(--font-body)', color: 'var(--color-text)', userSelect: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--color-neutral-900)', zIndex: 2 }} />
      <canvas ref={v.canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      <div ref={v.cardRef} style={{ position: 'absolute', left: 0, top: 0, width: 'min(400px,78vw)', opacity: 0, pointerEvents: 'none', willChange: 'transform,opacity', background: 'color-mix(in srgb, var(--color-bg) 84%, transparent)', border: '1px solid var(--color-divider)', borderTop: '1px solid var(--color-accent)', padding: '22px 28px 24px', display: 'flex', flexDirection: 'column', gap: 6, boxSizing: 'border-box' }}>
        <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--color-neutral-500)' }}>{v.card.kicker}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: 40, lineHeight: 1.1 }}>{v.card.title}</span>
        <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--sub, var(--color-accent-700))', fontStyle: 'italic' }}>{v.card.sub}</span>
        {v.expanded ? (
          <>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.65, textAlign: 'justify', textWrap: 'pretty' }}>{v.card.body}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 12 }}>
              <button type="button" onClick={v.collapseCard} style={{ color: 'var(--sub, var(--color-accent-700))', font: 'inherit', padding: 0, background: 'none', border: 0, borderBottom: '1px solid currentColor', cursor: 'pointer' }}>{v.closeLabel}</button>
            </div>
          </>
        ) : (
          <span style={{ marginTop: 6, fontSize: 12, fontStyle: 'italic', color: 'var(--color-neutral-500)' }}>{v.spaceHint}</span>
        )}
      </div>

      <div ref={v.promptRef} style={{ position: 'absolute', left: 0, top: 0, opacity: 0, pointerEvents: 'none', transition: 'opacity 250ms ease', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)', border: '1px solid var(--color-divider)', borderTop: '1px solid var(--color-accent)', whiteSpace: 'nowrap', zIndex: 3 }}>
        <span style={{ border: '1px solid var(--color-text)', padding: '1px 8px', fontSize: 11, letterSpacing: '.1em', borderRadius: 3 }}>{v.promptKey}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: 18 }}>{v.promptText}</span>
      </div>
      <div ref={v.loadRef} role="button" tabIndex={0} aria-label="Skip loading animation" onClick={v.skipLoad} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') v.skipLoad(); }} style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '14vh', boxSizing: 'border-box', gap: 14, transition: 'opacity 900ms ease, visibility 900ms', cursor: 'pointer' }}>
        <span ref={v.loadTextRef} style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: 22, letterSpacing: '.02em' }}>{v.loadingLabel}</span>
        <span ref={v.loadPctRef} style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontFeatureSettings: "'tnum'" }}>0%</span>
      </div>

      <header style={{ position: 'absolute', top: 26, left: 20, right: 24, display: 'flex', alignItems: 'flex-start', gap: 20, zIndex: 2 }}>
        <div style={{ flex: 1 }} />
        <div role="group" aria-label={v.langLabel} style={{ display: 'flex', gap: 8, alignItems: 'center', height: 40 }}>
          <button type="button" onClick={v.setEn} aria-pressed={!v.isJapanese} style={{ color: v.enColor, background: 'none', border: 0, borderBottom: `1px solid ${v.enRule}`, padding: '4px 2px', cursor: 'pointer', font: 'inherit', fontSize: 12 }}>EN</button>
          <button type="button" onClick={v.setJa} aria-pressed={v.isJapanese} style={{ color: v.jaColor, background: 'none', border: 0, borderBottom: `1px solid ${v.jaRule}`, padding: '4px 2px', cursor: 'pointer', font: 'inherit', fontSize: 12 }}>日本語</button>
        </div>
        <button type="button" onClick={v.toggleSound} aria-label={v.sound ? 'Mute sound' : 'Enable sound'} aria-pressed={v.sound} title="Sound" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--color-divider)', background: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--color-text)', opacity: v.soundOpacity }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        </button>
      </header>

      <div ref={v.ctrlRef} style={{ opacity: 0, transition: 'opacity 800ms ease', position: 'absolute', left: '50%', bottom: '9%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--color-neutral-500)', zIndex: 2, padding: '6px 14px', background: 'color-mix(in srgb, var(--color-bg) 85%, transparent)', borderRadius: 'var(--radius-md, 4px)' }}>
        <span>{v.backLabel}</span>
        <svg width="34" height="8" viewBox="0 0 34 8" fill="none" stroke="currentColor" strokeWidth="1"><path d="M33 4H1M5 1L1 4l4 3" /></svg>
        <button type="button" onPointerDown={v.backDown} onPointerUp={v.release} onPointerLeave={v.release} onPointerCancel={v.release} style={{ ...circleBtn, background: v.aBg }}>A</button>
        <button type="button" onPointerDown={v.fwdDown} onPointerUp={v.release} onPointerLeave={v.release} onPointerCancel={v.release} style={{ ...circleBtn, background: v.dBg }}>D</button>
        <svg width="34" height="8" viewBox="0 0 34 8" fill="none" stroke="currentColor" strokeWidth="1"><path d="M1 4h32M29 1l4 3-4 3" /></svg>
        <span>{v.fwdLabel}</span>
        <span style={{ width: 1, height: 18, background: 'var(--color-divider)' }} />
        <button type="button" onPointerDown={v.shiftDown} onPointerUp={v.shiftUp} onPointerLeave={v.shiftUp} onPointerCancel={v.shiftUp} style={{ height: 30, padding: '0 12px', borderRadius: 15, border: '1px solid var(--color-neutral-500)', background: v.shiftBg, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '.1em', color: 'var(--color-text)' }}>SHIFT</button>
        <span>{v.runLabel}</span>
      </div>
    </div>
  );
}
