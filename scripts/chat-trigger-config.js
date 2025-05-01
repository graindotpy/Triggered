// scripts/chat-trigger-config.js

class ChatTriggerConfig extends FormApplication {
  /** Configure the FormApplication options using the v12+ API */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:           'chat-trigger-config',
      title:        'Configure Chat Triggers',
      template:     'modules/chat-trigger/templates/trigger-config.html',
      width:        700,
      closeOnSubmit:true
    });
  }

  /** Register Handlebars helpers */
  static registerHelpers() {
    Handlebars.registerHelper('ifEquals', (a, b, opts) =>
      String(a) === String(b) ? opts.fn(this) : opts.inverse(this)
    );
    Handlebars.registerHelper('range', (start, end) => {
      const from = Number(start);
      const to   = Number(end);
      return Array.from({ length: to - from + 1 }, (_, i) => from + i);
    });
  }

  /** Load existing triggers and provide them to the template */
  async getData() {
    const raw = game.settings.get('chat-trigger', 'triggers');
    console.log('[ChatTriggerConfig] getData raw:', raw);

    let triggers = [];
    if (typeof raw === 'string') {
      try { triggers = JSON.parse(raw); }
      catch (e) {
        console.warn('ChatTriggerConfig: failed to parse triggers JSON', e);
        triggers = [];
      }
    } else if (Array.isArray(raw)) {
      triggers = raw;
    }

    console.log('[ChatTriggerConfig] getData normalized triggers:', triggers);
    return { triggers, actors: game.actors.contents };
  }

  /** Process form submission and persist the triggers array */
  async _updateObject(_event, formData) {
    console.log('[ChatTriggerConfig] _updateObject formData:', formData);

    // Build structured entries from the flat formData keys
    const entries = [];
    for (const [key, value] of Object.entries(formData)) {
      const m = key.match(/^triggers\[(\d+)\]\.(\w+)$/);
      if (!m) continue;
      const [, idx, field] = m;
      entries[idx] = entries[idx] || {};
      entries[idx][field] = value;
    }

    // Filter out incomplete rows and coerce types
    const cleaned = entries
      .filter(e => e.actorId && e.triggerValue)
      .map(e => ({
        actorId:      e.actorId,
        triggerValue: Number(e.triggerValue),
        filePath:     e.filePath || '',
        macroId:      e.macroId  || ''
      }));

    console.log('[ChatTriggerConfig] _updateObject cleaned:', cleaned);

    // Prevent accidental full-clear
    if (!cleaned.length) {
      ui.notifications.warn('Chat Trigger: No valid entries—previous settings retained.');
      return this.close();
    }

    await game.settings.set('chat-trigger', 'triggers', cleaned);
    this.close();
  }

  /** Handle Add/Remove row buttons */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.add-row').click(() => {
      const tbody        = html.find('tbody');
      const idx          = tbody.children().length;
      const actorOptions = game.actors.contents
        .map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      const numberOptions = Handlebars.helpers.range(1, 20)
        .map(n => `<option value="${n}">${n}</option>`).join('');

      const row = $(`
        <tr>
          <td>
            <select name="triggers[${idx}].actorId">
              <option value="">Select Actor</option>
              ${actorOptions}
            </select>
          </td>
          <td>
            <select name="triggers[${idx}].triggerValue">
              ${numberOptions}
            </select>
          </td>
          <td><input type="text" name="triggers[${idx}].filePath"  value="" placeholder="Animation path"></td>
          <td><input type="text" name="triggers[${idx}].macroId"   value="" placeholder="Macro ID"></td>
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
  // 1) Register the hidden storage setting
  game.settings.register('chat-trigger', 'triggers', {
    config:  false,
    scope:   'world',
    type:    Array,
    default: []
  });

  // 2) Migrate any old string‐based triggers into an Array
  try {
    const raw = game.settings.get('chat-trigger', 'triggers');
    if (typeof raw === 'string') {
      const arr = JSON.parse(raw);
      game.settings.set('chat-trigger', 'triggers', Array.isArray(arr) ? arr : []);
    }
  } catch (err) {
    console.warn('Chat Trigger migration skipped:', err);
  }

  // 3) Register the Configure… menu entry
  game.settings.registerMenu('chat-trigger', 'configureTriggers', {
    name:       'Configure Triggers',
    label:      'Configure…',
    hint:       'Add or remove chat-trigger rules.',
    icon:       'fas fa-bolt',
    type:       ChatTriggerConfig,
    restricted: true
  });

  // 4) Register Handlebars helpers
  ChatTriggerConfig.registerHelpers();
});