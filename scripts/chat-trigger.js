// scripts/chat-trigger.js

Hooks.once('init', () => {
  console.log('Chat Trigger | init');
  Hooks.on('createChatMessage', async (message, options, userId) => {
    console.log('Chat Trigger | createChatMessage fired', {
      isRoll: message.isRoll,
      rolls:  message.rolls
    });

    // 1) Skip non-roll messages
    if (!message.isRoll) {
      console.log('Chat Trigger | Skipping – not a roll');
      return;
    }

    // 2) Extract the first Roll instance from the new .rolls array
    const [roll] = message.rolls;
    if (!roll) {
      console.log('Chat Trigger | Skipping – no rolls array or empty', message.rolls);
      return;
    }
    const total = roll.total;
    console.log('Chat Trigger | Roll total:', total);

    // 3) Resolve the speaker’s Actor
    const speakerActor = ChatMessage.getSpeakerActor(message.speaker);
    if (!speakerActor) {
      console.log('Chat Trigger | No actor for speaker', message.speaker);
      return;
    }

    // 4) Find the matching token on the canvas
    const tokenId = message.speaker.token;
    const token   = canvas.tokens.get(tokenId)
                   ?? canvas.tokens.placeables.find(t => t.actor?.id === speakerActor.id);
    if (!token) {
      console.log('Chat Trigger | No token found for actor on canvas');
      return;
    }

    // 5) Load your configured triggers
    const triggers = game.settings.get('chat-trigger', 'triggers') || [];
    console.log('Chat Trigger | Loaded triggers:', triggers);

    // 6) Check each trigger for actorId + total match
    for (const t of triggers) {
      console.log('Chat Trigger | Checking trigger', t);
      if (t.actorId !== speakerActor.id) {
        console.log('Chat Trigger | Actor ID mismatch', t.actorId, speakerActor.id);
        continue;
      }
      if (Number(t.triggerValue) !== total) {
        console.log('Chat Trigger | Roll value mismatch', t.triggerValue, total);
        continue;
      }

      console.log('Chat Trigger | Trigger match!');

      // 7a) Play animation if provided
      if (t.filePath) {
        new Sequence()
          .effect()
            .file(t.filePath)
            .atLocation(token)
          .play();
      }
      // 7b) Execute macro if provided
      if (t.macroId) {
        const macro = game.macros.get(t.macroId);
        if (macro) await macro.execute();
        else ui.notifications.warn(`Chat Trigger | Macro ${t.macroId} not found`);
      }
    }
  });
});

Hooks.once('ready', () => {
  console.log('Chat Trigger | ready (Foundry v' + game.version +
              ', Sequencer v' + (game.modules.get('sequencer')?.version || 'N/A') + ')');
});
