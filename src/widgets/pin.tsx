import React from 'react';
import { renderWidget, usePlugin, useTrackerPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { errorMessage, openQuestionEditor, readQuestion } from '../questions';

function PinWidget() {
  const plugin = usePlugin();
  const value = useTrackerPlugin(async (api) => {
    const context = await api.widget.getWidgetContext<WidgetLocation.RightSideOfEditor>();
    try { return { remId: context.remId, question: await readQuestion(api, context.remId) }; }
    catch { return { remId: context.remId, question: '', failed: true }; }
  }, []);
  if (!value || (!value.question && !value.failed)) return null;
  return <button className="pin-button" aria-label="Angepinnte Frage bearbeiten"
    title={value.failed ? 'Frage konnte nicht geladen werden. Zum erneuten Öffnen klicken.' : `Frage bearbeiten: ${value.question}`}
    onClick={async (event) => {
      event.stopPropagation();
      try { await openQuestionEditor(plugin, value.remId); }
      catch (error) { await plugin.app.toast(errorMessage(error)); }
    }}>
      <svg className="question-card-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.4 2.4 0 0 1 4.6 1c0 1.6-2.3 1.9-2.3 3.5" />
        <path d="M12 16.7h.01" />
      </svg>
    </button>;
}

renderWidget(PinWidget);
