// scripts/chat-trigger-config.js

class ChatTriggerConfig extends FormApplication {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: 'chat-trigger-config',
      title: 'Configure Chat Triggers',
      template: 'modules/chat-trigger/templates/trigger-config.html',
      width: 700,
      closeOnSubmit: true
    });
  }

  static registerHelpers() {
    // No more ifEquals/range needed for dropdowns
  }

  /** Provide data to the template */
  async getData() {
    const raw = game.settings.get('chat-trigger', 'triggers');
    let triggers = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
    return { triggers };
  }

  /** Persist changes back to world settings */
  async _updateObject(_event, formData) {
    // Build structured entries from form fields
    const entries = [];
    for (const [key, value] of Object.entries(formData)) {
      const match = key.match(/^triggers\[(\d+)\]\.(\w+)$/);
      if (!match) continue;
      const [, idx, field] = match;
      entries[idx] = entries[idx] || {};
      entries[idx][field] = value;
    }
    // Clean out incomplete rows and convert types
    const cleaned = entries
      .filter(e => e.actorId && e.triggerValue)
      .map(e => ({
        actorId:      e.actorId,
        triggerValue: Number(e.triggerValue),
        filePath:     e.filePath || '',
        macroId:      e.macroId  || ''
      }));
    if (cleaned.length === 0) {
      ui.notifications.warn('Chat Trigger: No valid entries—previous settings retained.');
      return this.close();
    }
    await game.settings.set('chat-trigger', 'triggers', cleaned);
    this.close();
  }

  /** Wire up Add/Remove row buttons */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('.add-row').click(() => {
      const tbody = html.find('tbody');
      const idx   = tbody.children().length;
      const row = $(`
        <tr>
          <td><input type="text" name="triggers[${idx}].actorId"      value="" placeholder="Actor ID"></td>
          <td><input type="number" name="triggers[${idx}].triggerValue" value="" min="1" max="20" placeholder="1–20"></td>
          <td><input type="text" name="triggers[${idx}].filePath"     value="" placeholder="Animation path"></td>
          <td><input type="text" name="triggers[${idx}].macroId"      value="" placeholder="Macro ID"></td>
          <td><button type="button" class="remove-row">–</button></td>
        </tr>`);
      tbody.append(row);
    });
    html.on('click', '.remove-row', ev => {
      $(ev.currentTarget).closest('tr').remove();
    });
  }
}

// Initialize on Foundry startup
Hooks.once('init', () => {
  // Register hidden storage setting
  game.settings.register('chat-trigger', 'triggers', {
    config:  false,
    scope:   'world',
    type:    Array,
    default: []
  });

  // Register the Configure… menu entry
  game.settings.registerMenu('chat-trigger', 'configureTriggers', {
    name:       'Configure Triggers',
    label:      'Configure…',
    hint:       'Add or remove chat-trigger rules.',
    icon:       'fas fa-bolt',
    type:       ChatTriggerConfig,
    restricted: true
  });
});
