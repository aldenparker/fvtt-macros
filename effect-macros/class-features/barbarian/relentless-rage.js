// Relentless Rage - Implements the Relentless Rage class feature. [MULTIPLE MACROS]

// ---------- ON CREATION ----------
actor.setFlag("1024bits-bag-of-holding", "relentless-rage-counter", 0);

// ---------- ON DELETION ----------
actor.unsetFlag("1024bits-bag-of-holding", "relentless-rage-counter");

// ---------- ON LONG RESTS ----------
actor.setFlag("1024bits-bag-of-holding", "relentless-rage-counter", 0);

// ---------- ON BEING DAMAGED ----------
// Check for 0 hp
if (actor.system.attributes.hp.value != 0) {
  return;
}

// Calculate the DC
const rr_counter = actor.getFlag("1024bits-bag-of-holding", "relentless-rage-counter");
const dc = 10 + (5 * rr_counter);

// Ask player if they were killed outright
new Dialog(
  {
    title: "Relentless Rage Confirmation",
    content: `Your HP has reached zero. Would you like to use Relentless Rage [DC ${dc}]? (Can not use if attack outright kills you)`,
    buttons: {
      yes: {
        label: "Yes",
        callback: async () => {
          // Determine advantage mode
          const advantage = actor?.flags?.["midi-qol"]?.advantage?.con?.save;
          const disadvantage = actor?.flags?.["midi-qol"]?.disadvantage?.con?.save;
          var advantage_mode = 0;
          if (advantage !== undefined && advantage === 1) {
            advantage_mode = 1;
          } else if (disadvantage !== undefined && disadvantage === 1) {
            advantage_mode = -1;
          }

          // Calculate roll
          const roll = await new CONFIG.Dice.D20Roll(
            `1d20 + ${actor.system.abilities.con.mod} + ${actor.system.abilities.con.save}`,
            {},
            {
              flavor: "Relentless Rage - Saving Throw",
              advantageMode: advantage_mode,
              critical: 20,
              fumble: 1,
              targetValue: dc
            }
          ).evaluate();
          
          // Build and send message
          ChatMessage.create({
              flavor: "Relentless Rage - Saving Throw",
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
                  roll: {
                    type: "save",
                    abilityId: "con"
                  },
                }
              }
            }
          );

          // Evaluate roll and apply effect if possible
          if (roll.total >= dc) {
            actor.applyDamage(-1);
          }

          // Up relentless rage counter
          actor.setFlag("1024bits-bag-of-holding", "relentless-rage-counter", rr_counter + 1);
        }
      },
      no: {
        label: "No"
      }
    },
    default: 'yes'
  }
).render(true);