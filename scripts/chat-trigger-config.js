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
    // Equality helper
    Handlebars.registerHelper('ifEquals', (a, b, opts) => a === b ? opts.fn(this) : opts.inverse(this));
    // Range helper for dropdown 1–20
    Handlebars.registerHelper('range', (start, end) => {
      const from = Number(start);
      const to = Number(end);
      const arr = [];
      for (let i = from; i <= to; i++) arr.push(i);
      return arr;
    });
  }

  async getData() {
    const triggers = game.settings.get('chat-trigger', 'triggers') || [];
    return { triggers, actors: game.actors.contents };
  }

  async _updateObject(_event, formData) {
    // Build entries from formData keys like triggers[0].actorId
    const entries = [];
    for (const [key, value] of Object.entries(formData)) {
      const match = key.match(/^triggers\[(\d+)\]\.(\w+)$/);
      if (!match) continue;
      const [_, idx, field] = match;
      entries[idx] = entries[idx] || {};
      entries[idx][field] = value;
    }
    // Clean up: require actorId & triggerValue
    const cleaned = entries
      .filter(e => e.actorId && e.triggerValue)
      .map(e => ({
        actorId: e.actorId,
        triggerValue: Number(e.triggerValue),
        filePath: e.filePath || '',
        macroId: e.macroId || ''
      }));
    await game.settings.set('chat-trigger', 'triggers', cleaned);
    this.close();
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.add-row').click(() => {
      const tbody = html.find('tbody');
      const idx = tbody.children().length;
      const actorOptions = game.actors.contents.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      const numberOptions = Array.from({ length: 20 }, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('');
      const row = $(
        `<tr>
           <td><select name="triggers[${idx}].actorId"><option value="">Select Actor</option>${actorOptions}</select></td>
           <td><select name="triggers[${idx}].triggerValue">${numberOptions}</select></td>
           <td><input type="text" name="triggers[${idx}].filePath" value=""></td>
           <td><input type="text" name="triggers[${idx}].macroId"  value=""></td>
           <td><button type="button" class="remove-row">–</button></td>
         </tr>`
      );
      tbody.append(row);
    });
    html.on('click', '.remove-row', ev => $(ev.currentTarget).closest('tr').remove());
  }
}

Hooks.once('init', () => {
  // Storage for trigger definitions
  game.settings.register('chat-trigger', 'triggers', {
    config: false,
    scope: 'world',
    type: Array,
    default: []
  });
  // Menu entry
  game.settings.registerMenu('chat-trigger', 'configureTriggers', {
    name: 'Configure Triggers',
    label: 'Configure...',
    hint: 'Add or remove chat-trigger rules.',
    icon: 'fas fa-bolt',
    type: ChatTriggerConfig,
    restricted: true
  });
  ChatTriggerConfig.registerHelpers();
});