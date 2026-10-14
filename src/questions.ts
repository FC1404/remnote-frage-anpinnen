import type { RNPlugin, CommandArgs } from '@remnote/plugin-sdk';

export const POWERUP = 'pinned_question';
export const PROPERTY = 'question';
export const MAX_LENGTH = 4000;

export async function readQuestion(plugin: RNPlugin, remId: string): Promise<string> {
  const rem = await plugin.rem.findOne(remId);
  if (!rem) throw new Error('Dieser Stichpunkt ist nicht verfügbar. Bitte öffne ihn erneut.');
  if (!(await rem.hasPowerup(POWERUP))) return '';
  return (await rem.getPowerupProperty(POWERUP, PROPERTY)) || '';
}

export async function saveQuestion(plugin: RNPlugin, remId: string, text: string, expected: string) {
  const question = text.trim();
  if (!question) throw new Error('Bitte gib eine Frage ein. Zum Löschen nutze „Entfernen“.');
  if (question.length > MAX_LENGTH) throw new Error(`Die Frage darf höchstens ${MAX_LENGTH} Zeichen haben.`);
  // Do not use app.transaction in a popup: the installed host dispatches its
  // callback to the index widget, where this popup's callback is not registered.
  if ((await readQuestion(plugin, remId)) !== expected) {
    throw new Error('Die Frage wurde inzwischen geändert. Öffne das Fenster erneut, um den aktuellen Stand zu laden.');
  }
  const rem = await plugin.rem.findOne(remId);
  if (!rem) throw new Error('Dieser Stichpunkt ist nicht mehr verfügbar.');
  const alreadyPinned = await rem.hasPowerup(POWERUP);
  await rem.addPowerup(POWERUP);
  try {
    // A literal rich-text string: punctuation and HTML are never interpreted.
    await rem.setPowerupProperty(POWERUP, PROPERTY, [question]);
  } catch (error) {
    // Remove a newly added, empty pin if the property write failed. Preserve
    // existing questions and any value that the host may already have saved.
    if (!alreadyPinned) {
      try {
        if (!(await rem.getPowerupProperty(POWERUP, PROPERTY))) await rem.removePowerup(POWERUP);
      } catch { /* Keep the original write error and leave the draft open. */ }
    }
    throw error;
  }
  if ((await readQuestion(plugin, remId)) !== question) {
    throw new Error('RemNote hat die Frage nicht bestätigt. Deine Eingabe bleibt geöffnet. Bitte versuche erneut zu speichern.');
  }
}

export async function removeQuestion(plugin: RNPlugin, remId: string, expected: string) {
  if ((await readQuestion(plugin, remId)) !== expected) {
    throw new Error('Die Frage wurde inzwischen geändert. Öffne das Fenster erneut, bevor du sie entfernst.');
  }
  const rem = await plugin.rem.findOne(remId);
  if (!rem) throw new Error('Dieser Stichpunkt ist nicht mehr verfügbar.');
  // Removes only this plugin's powerup and its question property.
  await rem.removePowerup(POWERUP);
  if (await rem.hasPowerup(POWERUP)) {
    throw new Error('RemNote hat das Entfernen nicht bestätigt. Bitte versuche es erneut.');
  }
}

export async function selectedRemId(plugin: RNPlugin, args?: CommandArgs): Promise<string | undefined> {
  if (args?.selectedRem?.length) {
    if (args.selectedRem.length !== 1) throw new Error('Bitte wähle genau einen Stichpunkt aus.');
    return args.selectedRem[0];
  }
  if (args?.focusedRem) return args.focusedRem;
  const selected = await plugin.editor.getSelectedRem();
  if (selected?.remIds.length) {
    if (selected.remIds.length !== 1) throw new Error('Bitte wähle genau einen Stichpunkt aus.');
    return selected.remIds[0];
  }
  return (await plugin.focus.getFocusedRem())?._id;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Das hat nicht geklappt. Bitte versuche es erneut.';
}

export async function openQuestionEditor(plugin: RNPlugin, remId: string) {
  await plugin.widget.openPopup('question_editor', { remId }, false);
}
