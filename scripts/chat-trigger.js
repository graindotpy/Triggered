// scripts/chat-trigger.js

Hooks.once('init', () => {
  console.log('Chat Trigger | init');
  Hooks.on('createChatMessage', async (message, options, userId) => {
    console.log('Chat Trigger | createChatMessage fired', { userId, isRoll: message.isRoll, speaker: message.speaker });

    // 1) Bail if it’s not a roll
    if (!message.isRoll) {
      console.log('Chat Trigger | Skipping – not a roll');
      return;
    }

    // 2) Inspect the roll object
    const roll = message.roll;
    console.log('Chat Trigger | Roll details:', roll);

    if (!roll) {
      console.log('Chat Trigger | Skipping – no roll object');
      return;
    }

    const total = roll.total;
    console.log('Chat Trigger | Roll total:', total);

    // 3) Resolve the speaker’s actor
    const speakerActor = ChatMessage.getSpeakerActor(message.speaker);
    if (!speakerActor) {
      console.log('Chat Trigger | No actor for speaker', message.speaker);
      return;
    }
    console.log('Chat Trigger | Speaker actor:', speakerActor.id, speakerActor.name);

    // 4) Find the token on the canvas
    const tokenId = message.speaker.token;
    const token = canvas.tokens.get(tokenId)
                ?? canvas.tokens.placeables.find(t => t.actor?.id === speakerActor.id);
    console.log('Chat Trigger | Resolved token:', token);

    if (!token) {
      console.log('Chat Trigger | No token found for actor on canvas');
      return;
    }

    // 5) Load configured triggers
    let triggers = [];
    try {
      triggers = game.settings.get('chat-trigger', 'triggers') || [];
    } catch (err) {
      console.error('Chat Trigger | Failed to read settings', err);
      return;
    }
    console.log('Chat Trigger | Loaded triggers:', triggers);

    // 6) Loop through triggers
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

      // 7a) Play animation if set
      if (t.filePath) {
        console.log('Chat Trigger | Playing animation', t.filePath);
        new Sequence()
          .effect()
            .file(t.filePath)
            .atLocation(token)
          .play();
      }

      // 7b) Execute macro if set
      if (t.macroId) {
        console.log('Chat Trigger | Executing macro', t.macroId);
        const macro = game.macros.get(t.macroId);
        if (macro) await macro.execute();
        else ui.notifications.warn(`Chat Trigger | Macro ${t.macroId} not found`);
      }
    }
  });
});

Hooks.once('ready', () => {
  console.log('Chat Trigger | ready (Foundry v' + game.version + ', Sequencer v' + (game.modules.get('sequencer')?.version || 'N/A') + ')');
});
