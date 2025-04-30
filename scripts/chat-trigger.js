Hooks.once('ready', () => {
  Hooks.on('createChatMessage', (message) => {
    if (!message.isRoll) return;
    const roll = message.roll;
    if (!roll) return;

    const actor = ChatMessage.getSpeakerActor(message.speaker);
    if (!actor) return;

    // Resolve token for placement
    const token = canvas.tokens.get(message.speaker.token)
      ?? canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
    if (!token) return;

    const triggers = game.settings.get('chat-trigger', 'triggers') || [];
    for (const t of triggers) {
      if (t.actorId !== actor.id) continue;
      const desired = Number(t.triggerValue);
      // Find a d20 term where any result equals desired
      const term = roll.terms.find(term =>
        term.faces === 20 && term.results.some(r => r.result === desired)
      );
      if (!term) continue;

      // Play animation if provided
      if (t.filePath) {
        new Sequence()
          .effect()
            .file(t.filePath)
            .atLocation(token)
          .play();
      }
      // Execute macro if provided
      if (t.macroId) {
        const macro = game.macros.get(t.macroId);
        if (macro) macro.execute();
      }
    }
  });
});