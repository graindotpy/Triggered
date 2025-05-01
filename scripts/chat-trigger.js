// scripts/chat-trigger.js

// 1) Register our hook on ChatMessage creation as early as possible
Hooks.once('init', () => {
  console.log('Chat Trigger | Initializing');
  Hooks.on('createChatMessage', async (message, options, userId) => {

    // 2) Only proceed if this message actually contains a dice roll
    if ( !message.isRoll ) return;
    const roll = message.roll;
    if ( !roll ) return;

    // 3) We only care about d20s matching the configured trigger value
    const total  = roll.total;
    const speakerActor = ChatMessage.getSpeakerActor(message.speaker);
    if ( !speakerActor ) return;

    // 4) Find the matching token on the canvas
    const tokenId = message.speaker.token;
    const token   = canvas.tokens.get(tokenId)
                   ?? canvas.tokens.placeables.find(t => t.actor?.id === speakerActor.id);
    if ( !token ) return;

    // 5) Load your configured triggers
    let triggers = [];
    try {
      triggers = game.settings.get('chat-trigger', 'triggers') ?? [];
    } catch {
      return ui.notifications.error('Chat Trigger | Failed to read settings');
    }

    // 6) For each trigger entry, check actor & roll total, then fire it
    for ( const t of triggers ) {
      if ( t.actorId !== speakerActor.id ) continue;    // wrong actor
      if ( Number(t.triggerValue) !== total ) continue; // wrong roll

      // 7a) Play an animation if one is set
      if ( t.filePath ) {
        new Sequence()
          .effect()
            .file(t.filePath)
            .atLocation(token)
          .play();
      }

      // 7b) Execute a Macro if one is set
      if ( t.macroId ) {
        const macro = game.macros.get(t.macroId);
        if ( macro ) await macro.execute();
        else ui.notifications.warn(`Chat Trigger | Macro ${t.macroId} not found`);
      }
    }
  });
});

// 8) A small ready-stage log to confirm Sequencer and settings are loaded
Hooks.once('ready', () => {
  console.log('Chat Trigger | Ready on Foundry v12, Sequencer v' + (game.modules.get('sequencer')?.version || 'N/A'));
});
