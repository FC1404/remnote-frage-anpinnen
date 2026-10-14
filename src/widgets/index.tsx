import { declareIndexPlugin, WidgetLocation, type ReactRNPlugin, type CommandArgs } from '@remnote/plugin-sdk';
import { POWERUP, PROPERTY, errorMessage, openQuestionEditor, selectedRemId } from '../questions';
import { registerBulletMenu } from '../menuCompatibility';

export async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerPowerup({
    code: POWERUP,
    name: 'Angepinnte Frage',
    description: 'Eine individuelle Frage zu diesem Stichpunkt.',
    options: { properties: [{ code: PROPERTY, name: 'Frage', hidden: true, onlyProgrammaticModifying: true }] },
  });
  await plugin.app.registerWidget('question_editor', WidgetLocation.Popup, {
    dimensions: { width: 'min(460px, 94vw)', height: 'auto' },
  });
  await plugin.app.registerWidget('pin', WidgetLocation.RightSideOfEditor, {
    powerupFilter: POWERUP,
    dimensions: { width: 32, height: 30 },
  });
  // FlashcardUnder adds content without replacing the built-in card renderer.
  await plugin.app.registerWidget('question_card', WidgetLocation.FlashcardUnder, {
    powerupFilter: POWERUP,
    dimensions: { width: '100%', height: 'auto' },
  });

  const action = async (args?: CommandArgs) => {
    try {
      const remId = await selectedRemId(plugin, args);
      if (!remId) { await plugin.app.toast('Bitte öffne das Menü an einem Stichpunkt.'); return; }
      await openQuestionEditor(plugin, remId);
    } catch (error) { await plugin.app.toast(errorMessage(error)); }
  };
  await plugin.app.registerCommand({
    id: 'pin-question-command', name: 'Frage bearbeiten',
    description: 'Frage zum ausgewählten Stichpunkt hinzufügen oder bearbeiten.',
    keywords: 'Frage Frage anpinnen bearbeiten pin question', action,
  });
  await registerBulletMenu(plugin, { id: 'pin-question-menu', name: '❔ Frage bearbeiten', action });
}

declareIndexPlugin(async (plugin) => {
  try { await onActivate(plugin); }
  catch (error) {
    console.error('Frage anpinnen: Start fehlgeschlagen', error);
    await plugin.app.toast(`Frage anpinnen konnte nicht vollständig starten: ${errorMessage(error)}`);
  }
}, async () => {});
