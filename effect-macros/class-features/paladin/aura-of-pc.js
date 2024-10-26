// Aura of Protection / Combat - Used in conjunction with Active Auras to switch between 10 ft and 30 ft aura. Used on toggle on.

// If not paladin, turn off and return
if (!actor.classes.hasOwnProperty("paladin")) {
  effect.disable = true;
  effect.isSuppressed = true;
  return;
}

// Get value and apply
const roll_data = token.actor.getRollData();
const aura_size = roll_data.scale.paladin["aura-radius"].value;
effect.setFlag("ActiveAuras", "radius", `${aura_size}`);

