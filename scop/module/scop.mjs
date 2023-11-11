// Import document classes.
import { ScopActor } from "./documents/actor.mjs";
import { ScopItem } from "./documents/item.mjs";
// Import sheet classes.
import { ScopActorSheet } from "./sheets/actor-sheet.mjs";
import { ScopItemSheet } from "./sheets/item-sheet.mjs";
// Import forms.
import { ScopHealthForm } from "./forms/health-form.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { SCOP } from "./helpers/config.mjs";


Hooks.once('init', async function() {

    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.scop = {
        ScopActor,
        ScopItem,
        rollItemMacro
    };

    // Add custom constants for configuration.
    CONFIG.SCOP = SCOP;

    // Define custom Document classes
    CONFIG.Actor.documentClass = ScopActor;
    CONFIG.Item.documentClass = ScopItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("scop", ScopActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("scop", ScopItemSheet, { makeDefault: true });

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});


// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
        if (typeof arguments[arg] != 'object') {
            outStr += arguments[arg];
        }
    }
    return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
});

Handlebars.registerHelper('not', v => !v);
Handlebars.registerHelper('equal', (v1, v2) => v1 == v2);
Handlebars.registerHelper('notEqual', (v1, v2) => v1 != v2);
Handlebars.registerHelper('greaterThan', (v1, v2) => v1 > v2);
Handlebars.registerHelper('greaterEqual', (v1, v2) => v1 >= v2);
Handlebars.registerHelper('lessEqualThan', (v1, v2) => v1 <= v2);
Handlebars.registerHelper('or', (v1, v2) => v1 || v2);

Handlebars.registerHelper('plural', function(value, singular, plural) {
    if (Math.abs(value) > 1) {
        return game.i18n.localize(plural);
    } else {
        return game.i18n.localize(singular);
    }
});

Handlebars.registerHelper('dots', function(value, max) {
    const filled_symbol = '<span class="dots"><i class="fa-solid fa-circle"></i></span>';
    const empty_symbol = '<span class="dots"><i class="fa-regular fa-circle"></i></span>';
    const white_space = '<span class="dots">&nbsp;</span>';
    const result = filled_symbol.repeat(value) + empty_symbol.repeat(max - value) + white_space;
    return result;
});

Handlebars.registerHelper('printDice', function(valid, discard, drama) {
    const main_roll = valid.concat(discard);
    const drama_index = main_roll.indexOf(drama);
    var result = '';
    for (let index=0; index < main_roll.length; index++) {
        const value = main_roll[index];
        var valid_style = 'valid-dice';
        if (value > 4) {
            valid_style = 'discarded-dice';
        }
        var drama_style = '';
        if (index == drama_index) {
            if (value == 1) {
                drama_style = 'good-drama-dice';
            } else if (value == 10) {
                drama_style = 'bad-drama-dice';
            } else {
                drama_style = 'drama-dice';
            }
        }
        result += `<span class="${valid_style} ${drama_style}">${value}</span>`;
    }
    return result;
});

Handlebars.registerHelper('printDramaDie', function(drama) {
    if (drama == 1) {
        return '<span class="good-drama-dice">1!!</span>';
    } else if (drama == 10) {
        return '<span class="bad-drama-dice">10!!</span>';
    } else {
        return '<span class="drama-doce">' + drama + '</span>';
    }
});


Hooks.once("ready", async function() {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});


/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== "Item") return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
        return ui.notifications.warn("You can only create macro buttons for owned Items");
    }
    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.scop.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "scop.itemMacro": true }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}


/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
    // Reconstruct the drop data so that we can load the item.
    const dropData = {
        type: 'Item',
        uuid: itemUuid
    };
    // Load the item from the uuid.
    Item.fromDropData(dropData).then(item => {
        // Determine if the item loaded and if it's an owned item.
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
        }

        // Trigger the item roll
        item.roll();
    });
}
