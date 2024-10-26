// Divine Smite - Implements divine smite. Should be run on damage roll.

// Check if token exists
if (token === undefined) {
  return;
}

// Grab all recent rolls by token and get the most recent attack and damage rolls
const token_rolls = game.messages.filter((msg) => msg.speaker.token === token.id &&  msg.flags.hasOwnProperty("dnd5e")).filter((msg) => msg.flags.dnd5e.hasOwnProperty("roll"));

const token_attack_rolls = token_rolls.filter((msg) => msg.flags.dnd5e.roll.type === "attack");
const token_damage_rolls = token_rolls.filter((msg) => msg.flags.dnd5e.roll.type === "damage");

const most_recent_attack_roll = token_attack_rolls[token_attack_rolls.length - 1];
const most_recent_damage_roll = token_damage_rolls[token_damage_rolls.length - 1];

// Check if attack roll has been made
if (most_recent_attack_roll === undefined) {
  return;
}

// Figure out if weapon used is a melee weapon
const weapon = [...token.actor.sourcedItems].filter(([uuid, item]) => item.id === most_recent_attack_roll.flags.dnd5e.item.id)[0][1];
const weapon_type = weapon.system.activities.contents.filter((activity) => activity.id === most_recent_attack_roll.flags.dnd5e.activity.id)[0].parent.type.value;
if (CONFIG.DND5E.weaponTypeMap[weapon_type] != "melee") {
 return;
}

// Build form and check for spell slots
const spell_slot_ids = ["spell1", "spell2", "spell3", "spell4", "spell5", "spell6", "spell7", "spell8", "spell9"]
var spell_slots_left = false;

var form = `<form><label for="slots">Spell Slot to Use:</label><select name="slots" id="slots">`;
for (var i = 0; i < 9; i++) {
  const num_left = actor.system.spells[spell_slot_ids[i]].value;

  if (num_left != 0) {
    spell_slots_left = true;
    form += `<option value="${spell_slot_ids[i]}">${i + 1} [${num_left} left]</option>`;
  }
}
form += `</select></form>`;

if (!spell_slots_left) {
  return;
}

// Build dialog and ask
new Dialog({
  title: "Divine Smite",
  content: `<p>Would you like to use divine smite?</p></br>` + form,
  buttons: {
    submit: {
      label: "Yes",
      callback: async (html) => {
        // Grab form response
        const formElement = html[0].querySelector('form');
        const formDataExtended = new FormDataExtended(formElement);
        const formData = formDataExtended.object;

        // Grab slot used, use, and convert to dice roll
        const used_slot = formData.slots;
        actor.system.spells[used_slot].value -= 1;

        var num_dice = 2;
        if (used_slot === "spell2") {
          num_dice += 1;
        } else if (used_slot === "spell3") {
          num_dice += 2;
        } else if (["spell4", "spell5", "spell6", "spell7", "spell8", "spell9"].includes(used_slot)) {
          num_dice += 3;
        }

        // Check targeted creature type and add bonus for undead or fiend
        const targets = most_recent_attack_roll.flags.dnd5e.targets
        for (var i = 0; i < targets.length; i++) {
          const id = targets[i].uuid.split(".")[1];
          const targetActor = game.actors.get(id);

          if (["undead", "fiend"].includes(targetActor.system.details.type.value)) {
            num_dice += 1;
          }
        }
        
        // Build dice formula and roll
        const roll = await new CONFIG.Dice.DamageRoll(
          `${num_dice}d8`,
          {},
          {
            "type": "radiant",
            "types": [
                "radiant"
            ],
            "isCritical": false,
          }
        ).evaluate();
        
        // Build and send message
        const chat_msg_config = {
          flavor: "Divine Smite - Damage Roll",
          content: roll.total,
          speaker: {
            actor: actor.id,
            alias: actor.name,
            scene: scene.id,
            token: token.id
          },
          rolls: [roll],
          flags: {
            dnd5e: {
              item: {
                id: item.id,
                type: item.type,
                uuid: `Actor.${token.actor.id}.Item.${item.id}`
              },
              roll: {
                type: "damage"
              },
              targets: targets
            }
          }
        }
        
        ChatMessage.create(chat_msg_config);
      }
    },
    cancel: { label: "No" },
  },
}).render(true);