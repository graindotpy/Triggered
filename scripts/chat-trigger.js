// scripts/chat-trigger.js

Hooks.once('init', () => {
  console.log('Chat Trigger | init');
  Hooks.on('createChatMessage', async (message, options, userId) => {
    console.log('Chat Trigger | createChatMessage fired', {
      isRoll:  message.isRoll,
      rolls:   message.rolls,
      speaker: message.speaker
    });

    // 1) Skip non-roll messages
    if (!message.isRoll) {
      console.log('Chat Trigger | Skipping – not a roll');
      return;
    }

    // 2) Extract the first Roll instance
    const [roll] = message.rolls;
    if (!roll) {
      console.log('Chat Trigger | Skipping – no rolls found');
      return;
    }

    // 3) Find the d20 term and get the raw die result
    const d20Term = roll.terms.find(t => t.faces === 20 && t.results.length);
    if (!d20Term) {
      console.log('Chat Trigger | No d20 term found in roll');
      return;
    }
    const dieValue = d20Term.results[0].result;
    console.log('Chat Trigger | d20 face result:', dieValue);

    // 4) Resolve the speaker’s Actor
    const speakerActor = ChatMessage.getSpeakerActor(message.speaker);
    if (!speakerActor) {
      console.log('Chat Trigger | No actor for speaker', message.speaker);
      return;
    }

    // 5) Find the matching Token on the canvas
    const tokenId = message.speaker.token;
    const token   = canvas.tokens.get(tokenId)
                   ?? canvas.tokens.placeables.find(t => t.actor?.id === speakerActor.id);
    if (!token) {
      console.log('Chat Trigger | No token found for actor on canvas');
      return;
    }

    // 6) Load your configured triggers
    const triggers = game.settings.get('chat-trigger', 'triggers') || [];
    console.log('Chat Trigger | Loaded triggers:', triggers);

    // 7) Check each trigger for actorId + dieValue match
    for (const t of triggers) {
      console.log('Chat Trigger | Checking trigger', t);
      if (t.actorId !== speakerActor.id) {
        console.log('Chat Trigger | Actor ID mismatch', t.actorId, speakerActor.id);
        continue;
      }
      if (Number(t.triggerValue) !== dieValue) {
        console.log('Chat Trigger | Roll value mismatch', t.triggerValue, dieValue);
        continue;
      }

      console.log('Chat Trigger | Trigger match!');

      // 8a) Play animation if provided
      if (t.filePath) {
        new Sequence()
          .effect()
            .file(t.filePath)
            .atLocation(token)
          .play();
      }

      // 8b) Execute macro if provided
      if (t.macroId) {
        const macro = game.macros.get(t.macroId);
        if (macro) {
          await macro.execute();
        } else {
          ui.notifications.warn(`Chat Trigger | Macro ${t.macroId} not found`);
        }
      }
    }
  });
});

Hooks.once('ready', () => {
  console.log(
    `Chat Trigger | ready (Foundry v${game.version}, Sequencer v${
      game.modules.get('sequencer')?.version ?? 'N/A'
    })`
  );
});
