// Brutal Critical Macro - Requires Effect Macros and should be run on Damage Rolls

// Grab all recent rolls by token and get the most recent attack and damage rolls
const token_rolls = game.messages.filter((msg) => msg.speaker.token === token.id &&  msg.flags.hasOwnProperty("dnd5e")).filter((msg) => msg.flags.dnd5e.messageType === "roll");

const token_attack_rolls = token_rolls.filter((msg) => msg.flags.dnd5e.roll.type === "attack");
const token_damage_rolls = token_rolls.filter((msg) => msg.flags.dnd5e.roll.type === "damage");

const most_recent_attack_roll = token_attack_rolls[token_attack_rolls.length - 1];
const most_recent_damage_roll = token_damage_rolls[token_damage_rolls.length - 1];

// Check if attack roll has been made
if (most_recent_attack_roll === undefined) {
  ui.notifications.error("Brutal Critical Macro could not run becase no attack roll was made for it's token yet.", {localize: true});
}

// Figure out if weapon used is a melee weapon
const weapon = [...token.actor.sourcedItems].filter(([uuid, item]) => item.id === most_recent_attack_roll.flags.dnd5e.item.id)[0][1];
const weapon_type = weapon.system.activities.contents.filter((activity) => activity.id === most_recent_attack_roll.flags.dnd5e.activity.id)[0].parent.type.value;
if (CONFIG.DND5E.weaponTypeMap[weapon_type] != "melee") {
 return;
}

// Check if it was a critical
if (most_recent_damage_roll.rolls[0].isCritical === true) {
  // Grab brutal-critical roll data from actor associated with token
  const roll_data = token.actor.getRollData();
  const brutal_critical_scale = roll_data.scale.barbarian["brutal-critical"].value;

  // Build dice formula and roll
  const roll = await new CONFIG.Dice.DamageRoll(`${most_recent_damage_roll.rolls[0].terms[0].formula}*${brutal_critical_scale}`, {}, most_recent_damage_roll.rolls[0].options).evaluate();
  
  // Build and send message
  const chat_msg_config = {
    flavor: "Brutal Critical - Extra Damage Roll",
    content: roll.total,
    speaker: most_recent_damage_roll.speaker,
    rolls: [roll],
    flags: {
      dnd5e: {
        activity: most_recent_damage_roll.flags.dnd5e.activity,
        item: {
          id: item.id,
          type: item.type,
          uuid: `Actor.${token.actor.id}.Item.${item.id}`
        },
        messageType: most_recent_damage_roll.flags.dnd5e.messageType,
        roll: most_recent_damage_roll.flags.dnd5e.roll,
        targets: most_recent_damage_roll.flags.dnd5e.targets
      }
    }
  }
  
  ChatMessage.create(chat_msg_config);
}
