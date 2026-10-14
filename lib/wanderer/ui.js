export function changeLanguage(lang) {
  document.documentElement.lang = lang;
  this.setState({ lang });
}

export function createViewModel() {
  const ja = this.state.lang === 'ja', d = this.state.dir;
  const on = 'color-mix(in srgb, var(--color-accent) 25%, transparent)';
  const c = this.cards[this.state.card], cc = c ? (ja ? c.ja : c.en) : ['', '', '', ''];
  return {
    promptRef: this.promptRef,
    promptKey: this.state.carPrompt === 'drive' ? 'D' : 'SPACE',
    promptText: this.state.carPrompt === 'drive' ? (ja ? '長押しで運転 · Shiftで加速' : 'Hold to drive · Shift to speed up') : (ja ? '車に乗る' : 'Get in the car'),
    ctrlRef: this.ctrlRef, loadRef: this.loadRef, loadCanvasRef: this.loadCanvasRef, loadPctRef: this.loadPctRef, loadTextRef: this.loadTextRef,
    loadingLabel: ja ? '道をととのえています' : 'Laying out the path',
    skipLoad: () => { if (this.loadP > 0.5) this.loadP = 1; },
    canvasRef: this.canvasRef, cardRef: this.cardRef, rootRef: this.rootRef,
    card: { kicker: cc[0], title: cc[1], sub: cc[2], body: cc[3] },
    expanded: this.state.expanded, collapsed: !this.state.expanded,
    spaceHint: ja ? '· スペースキーで開く ·' : '· Press Space ·', closeLabel: ja ? '閉じる' : 'Close',
    actLabel: ja ? '第一幕' : 'Act I', mapLabel: ja ? '地図を見る' : 'View the map', langLabel: ja ? '言語' : 'Language',
    backLabel: ja ? '戻る' : 'back', fwdLabel: ja ? '進む' : 'forward',
    isJapanese: ja,
    jaColor: ja ? 'var(--color-text)' : 'var(--color-neutral-500)', enColor: ja ? 'var(--color-neutral-500)' : 'var(--color-text)',
    jaRule: ja ? 'var(--color-accent)' : 'transparent', enRule: ja ? 'transparent' : 'var(--color-accent)',
    setJa: () => this.setLanguage('ja'), setEn: () => this.setLanguage('en'),
    toggleSound: () => this.toggleSound(), sound: this.state.sound, soundOpacity: this.state.sound ? 1 : 0.45,
    collapseCard: () => this.setState({ expanded: false }),
    runLabel: ja ? '走る' : 'run', shiftBg: this.state.run ? on : 'transparent',
    shiftDown: () => { this.keys.run = true; this.setState({ run: true }); },
    shiftUp: () => { if (this.keys.run) { this.keys.run = false; this.setState({ run: false }); } },
    aBg: d < 0 ? on : 'transparent', dBg: d > 0 ? on : 'transparent',
    backDown: () => { this.keys.btn = -1; this.syncDir(); }, fwdDown: () => { this.keys.btn = 1; this.syncDir(); },
    release: () => { if (this.keys.btn) { this.keys.btn = 0; this.syncDir(); } }
  };
}
