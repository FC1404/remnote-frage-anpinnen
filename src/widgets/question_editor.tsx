import React, { useCallback } from 'react';
import { renderWidget, usePlugin, useTrackerPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { QuestionEditor } from '../QuestionEditor';
import { readQuestion, saveQuestion, removeQuestion } from '../questions';

function EditorForRem({ remId }: { remId: string }) {
  const plugin = usePlugin();
  const load = useCallback(() => readQuestion(plugin, remId), [plugin, remId]);
  return <QuestionEditor load={load}
    save={(text, expected) => saveQuestion(plugin, remId, text, expected)}
    remove={(expected) => removeQuestion(plugin, remId, expected)}
    close={() => plugin.widget.closePopup()} />;
}

function EditorWidget() {
  const context = useTrackerPlugin((plugin) => plugin.widget.getWidgetContext<WidgetLocation.Popup>(), []);
  const remId: unknown = context?.contextData?.remId;
  if (!context) return <p className="status" role="status">Frage wird geladen …</p>;
  if (typeof remId !== 'string' || !remId) return <p className="status error" role="alert">Kein Stichpunkt ausgewählt. Bitte öffne das Fenster erneut.</p>;
  return <EditorForRem key={remId} remId={remId} />;
}

renderWidget(EditorWidget);
