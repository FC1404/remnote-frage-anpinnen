import React, { useLayoutEffect } from 'react';
import { renderWidget, usePlugin, useTrackerPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { readQuestion } from '../questions';

function QuestionCard() {
  const plugin = usePlugin();
  useLayoutEffect(() => {
    // Only change our own iframe document, never RemNote's outer document.
    if (!plugin.inSandbox) return;
    document.documentElement.classList.add('pinned-question-queue');
    return () => document.documentElement.classList.remove('pinned-question-queue');
  }, [plugin]);
  const result = useTrackerPlugin(async (plugin) => {
    const context = await plugin.widget.getWidgetContext<WidgetLocation.FlashcardUnder>();
    try { return { question: await readQuestion(plugin, context.remId) }; }
    catch { return { question: '', failed: true }; }
  }, []);
  if (result?.failed) return <p className="status error" role="status">Angepinnte Frage konnte nicht geladen werden.</p>;
  if (!result?.question) return null;
  return <div className="question-card-space">
    <aside className="question-card" aria-label="Angepinnte Frage">
      <div className="question-card-label">
        <svg className="question-card-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.6-2.3 1.9-2.3 3.5" />
          <path d="M12 16.7h.01" />
        </svg>
        <span>Frage</span>
      </div>
      <p>{result.question}</p>
    </aside>
  </div>;
}

renderWidget(QuestionCard);
