import React, { useEffect, useRef, useState } from 'react';
import { errorMessage, MAX_LENGTH } from './questions';

export interface QuestionEditorProps {
  load: () => Promise<string>;
  save: (question: string, expected: string) => Promise<void>;
  remove: (expected: string) => Promise<void>;
  close: () => Promise<void>;
}

export function QuestionEditor({ load, save, remove, close }: QuestionEditorProps) {
  const [text, setText] = useState('');
  const [original, setOriginal] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    load().then((value) => {
      if (active) { setText(value); setOriginal(value); }
    }).catch((err) => {
      if (active) { setError(errorMessage(err)); setLoadFailed(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  useEffect(() => { if (!loading && !loadFailed) field.current?.focus(); }, [loading, loadFailed]);

  async function finish(operation: 'save' | 'remove') {
    if (lock.current || loading || loadFailed) return;
    if (operation === 'save' && !text.trim()) { setError('Bitte gib eine Frage ein.'); return; }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      if (operation === 'save') await save(text, original);
      else await remove(original);
      // Retain the committed value if closing the host popup should fail.
      const committed = operation === 'save' ? text.trim() : '';
      setOriginal(committed);
      setText(committed);
      await close();
    } catch (err) { setError(errorMessage(err)); }
    finally { lock.current = false; setBusy(false); }
  }

  async function cancel() {
    if (lock.current) return;
    try { await close(); } catch (err) { setError(errorMessage(err)); }
  }

  return <section className="question-editor" aria-labelledby="question-title" aria-busy={loading || busy}
    onKeyDown={(event) => {
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); void cancel(); }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); void finish('save'); }
    }}>
    <header><span className="pin-heading" aria-hidden="true">
      <svg className="question-card-icon" width="23" height="23" style={{ width: 23, height: 23 }} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.6-2.3 1.9-2.3 3.5" />
        <path d="M12 16.7h.01" />
      </svg>
    </span><div>
      <h1 id="question-title">{original ? 'Frage bearbeiten' : 'Frage anpinnen'}</h1>
      <p>Wird zusätzlich auf deiner Lernkarte angezeigt.</p>
    </div></header>
    <label htmlFor="pinned-question">Deine Frage</label>
    <textarea ref={field} id="pinned-question" rows={4} value={text} maxLength={MAX_LENGTH}
      placeholder={loading ? 'Frage wird geladen …' : 'Was möchtest du dich dazu fragen?'}
      disabled={loading || busy || loadFailed} aria-describedby={error ? 'question-error' : undefined}
      onChange={(event) => { setText(event.target.value); setError(''); }} />
    {error && <p id="question-error" className="error" role="alert">{error}</p>}
    <footer>
      {original && <button className="danger" disabled={busy || loading || loadFailed} onClick={() => void finish('remove')}>Entfernen</button>}
      <span className="spacer" />
      <button disabled={busy} onClick={() => void cancel()}>Abbrechen</button>
      <button className="primary" disabled={busy || loading || loadFailed || !text.trim() || text.trim().length > MAX_LENGTH}
        onClick={() => void finish('save')}>{busy ? 'Bitte warten …' : original ? 'Speichern' : 'Fertig'}</button>
    </footer>
  </section>;
}
