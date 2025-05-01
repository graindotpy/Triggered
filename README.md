# Triggered!

A small system-agnostic FoundryVTT module designed to watch the chat log, and take an action. Triggered can (currently) watch for any outcome on a D20 roll taken by an actor, then either play a Sequencer animation or trigger a macro.

This project was inspired by a reddit post, showing off Persona 5 style crit animations on Natural 20s. Triggered has been designed to complete one task on my end - so no further updates are planned.

That said, if people are interested, please pass along any suggestions and I'll see what can be done!

## Usage
Essentially, Triggered implements a flow of "When X does Y, do Z".

X can be any FoundryVTT actor. Y is rolling a specified number on a D20. Z is either a Sequencer animation, or a Macro.

These values are set from the module settings menu - bear in mind that if you are using a webm animation, the location is calculated based on the ./data path.