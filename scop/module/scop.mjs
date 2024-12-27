import { ScopActor } from "./documents/actor.mjs";
import { ScopItem } from "./documents/item.mjs";
import { ScopActorSheet } from "./sheets/actor-sheet.mjs";
import { ScopItemSheet } from "./sheets/item-sheet.mjs";
import { ScopHealthForm } from "./forms/health-form.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { SCOP, registerSettings } from "./helpers/config.mjs";
import { ScopEffortRoll } from "./forms/roll-form.mjs";


// Hooks ///////////////////////////////////////////////////////////////////////////////////////////
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

    registerSettings();

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});

// Hides the Effort button if the user is not the owner of the message.
Hooks.on("renderChatMessage", (app, html, data) => {
    const button = html.find(".chat-effort-button");
    if (button.length > 0) {
        const actorId = button.data("actorId");
        const actor = game.actors.get(actorId);
        const userId = game.data.userId;
        const ownership = actor.ownership[userId];
        if (ownership == CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
            button.click(_onEffortButton);
        } else {
            $(button).hide();
        }
    }
});

async function _onEffortButton(event) {
    event.preventDefault();
    const effortRoll = new ScopEffortRoll(event);
    await effortRoll.updateChatMessage();
}

Hooks.once("ready", async function() {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});


// Handlebars Helpers //////////////////////////////////////////////////////////////////////////////
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
Handlebars.registerHelper('and', (v1, v2) => v1 && v2);

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

Handlebars.registerHelper('open-dots', function(value, max) {
    const filled_symbol = '<span class="dots"><i class="fa-solid fa-circle"></i></span>';
    const white_space = '<span class="dots">&nbsp;</span>';
    const result = filled_symbol.repeat(value) + white_space;
    return result;
});

function formatValidDice(value, cutValue) {
    if (value <= cutValue) {
        return 'valid-dice';
    } else {
        return 'discarded-dice';
    }
}

function formatDramaDice(drama, diceType, cutValue) {
    const use_drama = game.settings.get("scop", "useDramaDice");
    if (!use_drama) {
        return "";
    } else if (drama == cutValue) {
        return "good-drama-dice";
    } else if (drama == diceType) {
        return "bad-drama-dice";
    } else {
        return "drama-dice";
    }
}

Handlebars.registerHelper('printDice', function(valid, discard, drama, diceType, cutValue) {
    const main_roll = valid.concat(discard);
    const drama_index = main_roll.indexOf(drama);
    var drama_printed = false;
    var result = '<div class="flexrow flex-group-center roll-results">';
    for (let index=0; index < main_roll.length; index++) {
        const value = main_roll[index];
        const valid_style = formatValidDice(value, cutValue);
        var drama_style = '';
        if (value == drama && !drama_printed) {
            drama_style = formatDramaDice(drama, diceType, cutValue);
            drama_printed = true;
        }
        result += `<span class="${valid_style} ${drama_style}">${value}</span>`;
    }
    result += '</div>';
    return result;
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
