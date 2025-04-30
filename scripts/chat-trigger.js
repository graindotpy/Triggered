Hooks.once('ready', () => {
  Hooks.on('createChatMessage', (message) => {
    // Only proceed for chat-rolls
    if (!message.isRoll) return;
    const roll = message.roll;
    if (!roll) return;

    // Resolve the speaker's Actor
    const actor = ChatMessage.getSpeakerActor(message.speaker);
    if (!actor) return;

    // Find the token on canvas
    const token = canvas.tokens.get(message.speaker.token)
      ?? canvas.tokens.placeables.find(t => t.actor?.id === actor.id);
    if (!token) return;

    // Get configured triggers
    const triggers = game.settings.get('chat-trigger', 'triggers') || [];
    // Examine each trigger for this actor
    for (const t of triggers) {
      if (t.actorId !== actor.id) continue;
      const desired = Number(t.triggerValue);
      // Look for any d20 roll result equal to the triggerValue
      const term = roll.terms.find(term =>
        term.faces === 20 && term.results.some(r => r.result === desired)
      );
      if (!term) continue;

      // Play animation if filePath is set
      if (t.filePath) {
        new Sequence()
          .effect()
            .file(t.filePath)
            .atLocation(token)
          .play();
      }
      // Execute macro if macroId is set
      if (t.macroId) {
        const macro = game.macros.get(t.macroId);
        if (macro) macro.execute();
      }
    }
  });
});