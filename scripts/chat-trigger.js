// scripts/chat-trigger.js

Hooks.once('init', () => {
  console.log('Chat Trigger | init');
  Hooks.on('createChatMessage', async (message) => {

    // Only proceed on roll messages
    if (!message.isRoll) return;

    // Grab the first Roll instance (v12+)
    const [roll] = message.rolls;
    if (!roll) return;

    // Find the d20 DiceTerm
    const d20Term = roll.terms.find(t => t.faces === 20 && t.results.length);
    if (!d20Term) return;

    // ——— Resolve the kept results exactly as Foundry does ———
    // Each result object has either `active` (preferred) or `discarded` flags.
    let kept = d20Term.results.filter(r => r.active === true);
    if (kept.length === 0) {
      // Fallback for older Foundry versions that use `discarded`
      kept = d20Term.results.filter(r => r.discarded === false);
    }
    if (kept.length === 0) {
      // If still nothing, fall back to all results (sum them)
      kept = d20Term.results;
    }
    // Sum all kept face values (for 2d20kh this is the single highest die,
    // for 2d20kl single lowest, for 1d20 just that one, etc.)
    const dieValue = kept.reduce((sum, r) => sum + r.result, 0);
    console.log('Chat Trigger | Resolved d20 value:', dieValue);
    // ————————————————————————————————————————————————

    // Resolve the speaker’s Actor
    const speakerActor = ChatMessage.getSpeakerActor(message.speaker);
    if (!speakerActor) return;

    // Find their Token on the canvas
    const token = canvas.tokens.get(message.speaker.token)
                ?? canvas.tokens.placeables.find(t => t.actor?.id === speakerActor.id);
    if (!token) return;

    // Load your configured triggers
    const triggers = game.settings.get('chat-trigger', 'triggers') || [];
    console.log('Chat Trigger | Loaded triggers:', triggers);

    // Check each trigger and fire when actor + dieValue match
    for (const t of triggers) {
      if (t.actorId !== speakerActor.id) continue;
      if (Number(t.triggerValue) !== dieValue) continue;
      console.log('Chat Trigger | Trigger match!');

      // Play an animation if provided
      if (t.filePath) {
        new Sequence()
          .effect()
            .file(t.filePath)
            .atLocation(token)
          .play();
      }

      // Execute a Macro if provided
      if (t.macroId) {
        const macro = game.macros.get(t.macroId);
        if (macro) await macro.execute();
        else ui.notifications.warn(`Chat Trigger | Macro ${t.macroId} not found`);
      }
    }
  });
});

Hooks.once('ready', () => {
  console.log(
    `Chat Trigger | ready (Foundry v${game.version}, Sequencer v${game.modules.get('sequencer')?.version ?? 'N/A'})`
  );
});
