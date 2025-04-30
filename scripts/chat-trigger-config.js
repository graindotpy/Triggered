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
    // Strict equality helper
    Handlebars.registerHelper('ifEquals', (a, b, opts) =>
      a === b ? opts.fn(this) : opts.inverse(this)
    );
    // Range helper for dropdown 1–20
    Handlebars.registerHelper('range', (start, end) => {
      const from = Number(start);
      const to   = Number(end);
      const arr  = [];
      for (let i = from; i <= to; i++) arr.push(i);
      return arr;
    });
  }

  /** Load existing triggers and actor list for the form */
  async getData() {
    const raw = game.settings.get('chat-trigger', 'triggers');
    let triggers = [];
    if (typeof raw === 'string') {
      try { triggers = JSON.parse(raw); }
      catch { triggers = []; }
    } else if (Array.isArray(raw)) {
      triggers = raw;
    }
    return {
      triggers,
      actors: game.actors.contents
    };
  }

  /** Process submitted form data and persist back to settings */
  async _updateObject(_event, formData) {
    // Build structured entries from form fields like triggers[0].actorId
    const entries = [];
    for (const [key, value] of Object.entries(formData)) {
      const m = key.match(/^triggers\[(\d+)\]\.(\w+)$/);
      if (!m) continue;
      const [_, idx, field] = m;
      entries[idx] = entries[idx] || {};
      entries[idx][field] = value;
    }

    // Clean and filter out any incomplete rows
    const cleaned = entries
      .filter(e => e.actorId && e.triggerValue)
      .map(e => ({
        actorId:      e.actorId,
        triggerValue: Number(e.triggerValue),
        filePath:     e.filePath || '',
        macroId:      e.macroId  || ''
      }));

    // Prevent accidental full-clear: if cleaned is empty, warn and retain old settings
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
      const actorOptions = game.actors.contents
        .map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      const numberOptions = Array.from({ length: 20 }, (_, i) =>
        `<option value="${i+1}">${i+1}</option>`).join('');
      const row = $(`
        <tr>
          <td><select name="triggers[${idx}].actorId">
                <option value="">Select Actor</option>${actorOptions}
              </select></td>
          <td><select name="triggers[${idx}].triggerValue">
                ${numberOptions}
              </select></td>
          <td><input type="text" name="triggers[${idx}].filePath" value=""></td>
          <td><input type="text" name="triggers[${idx}].macroId"  value=""></td>
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
  // 1) Migrate any old string-based triggers into an Array
  const raw = game.settings.get('chat-trigger', 'triggers');
  if (typeof raw === 'string') {
    let arr = [];
    try { arr = JSON.parse(raw); } catch {}
    game.settings.set('chat-trigger', 'triggers', arr);
  }

  // 2) Register the hidden storage setting
  game.settings.register('chat-trigger', 'triggers', {
    config:  false,
    scope:   'world',
    type:    Array,
    default: []
  });

  // 3) Register the Configure… menu entry
  game.settings.registerMenu('chat-trigger', 'configureTriggers', {
    name:     'Configure Triggers',
    label:    'Configure...',
    hint:     'Add or remove chat-trigger rules.',
    icon:     'fas fa-bolt',
    type:     ChatTriggerConfig,
    restricted: true
  });

  // 4) Register our Handlebars helpers
  ChatTriggerConfig.registerHelpers();
});