import type { RNPlugin } from '@remnote/plugin-sdk';

type MenuCommand = Parameters<RNPlugin['app']['registerRemMenuItem']>[0];

/**
 * SDK 0.0.46 sends {id,name}. RemNote Desktop's October 2026 host validates
 * {id,html}, but its implementation and menu renderer still read name.
 * The host validates the payload without stripping extra keys, so sending both
 * fixes this mismatch. Keep the private transport workaround isolated and only
 * use it after the public API reports the known argument-validation failure.
 */
export async function registerBulletMenu(plugin: RNPlugin, command: MenuCommand) {
  try {
    await plugin.app.registerRemMenuItem(command);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/html/i.test(message) || !/argument|invalid|required/i.test(message)) throw error;
    const transport = plugin as unknown as {
      _call: (method: string, args: Record<string, string>) => Promise<void>;
    };
    // The public SDK call already registered command.action under command.id.
    const html = command.name.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]!);
    // Unlike most SDK namespaces, AppNamespace uses unprefixed endpoints.
    await transport._call('registerRemMenuItem', { id: command.id, name: command.name, html });
  }
}
