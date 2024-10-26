// Indomitable Might - Implements the Indomitable Might class skill. Run on skill check.

// Check if token exists
if (token === undefined) {
  return;
}

// Grab all recent rolls by token and get the most recent attack and damage rolls
const token_rolls = game.messages.filter((msg) => msg.speaker.token === token.id &&  msg.flags.hasOwnProperty("dnd5e")).filter((msg) => msg.flags.dnd5e.hasOwnProperty("roll"));
const token_strength_check_rolls = token_rolls.filter((msg) => msg.flags.dnd5e.roll.type === "ability").filter((msg) => msg.flags.dnd5e.roll.abilityId === "str");

const most_recent_strength_check_roll = token_strength_check_rolls[token_strength_check_rolls.length - 1];

// Check if strength check roll has been made
if (most_recent_strength_check_roll === undefined) {
  return;
}

// Check if roll was less than strength score
if (most_recent_strength_check_roll.rolls[0].total < actor.system.abilities.str.value) {
  // Build and send message
  new Dialog(
    {
      title: "Indomitable Might Activated",
      content: `Last strength check roll [${most_recent_strength_check_roll.rolls[0].total}] was less than your strength score [${actor.system.abilities.str.value}], so use the strength score instead.`,
      buttons: {
        ok: {
          label: "Ok",
        }
      },
      default: 'ok'
    }
  ).render(true);
}
