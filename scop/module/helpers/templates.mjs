/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
    return loadTemplates([
        // Actor partials.
        "systems/scop/templates/actor/parts/actor-header.html",
        "systems/scop/templates/actor/parts/actor-limits.html",
        "systems/scop/templates/actor/parts/actor-concepts.html",
        "systems/scop/templates/actor/parts/actor-conditions.html",
        "systems/scop/templates/actor/parts/actor-skills.html",
        "systems/scop/templates/actor/parts/actor-skills-list.html",
        "systems/scop/templates/actor/parts/actor-special-ability.html",
        "systems/scop/templates/actor/parts/actor-powers.html",
        "systems/scop/templates/actor/parts/actor-power-list.html",
        "systems/scop/templates/actor/parts/actor-powerskills-list.html",
        "systems/scop/templates/actor/parts/actor-equipment.html",
        "systems/scop/templates/forms/parts/roll-header.html",
        "systems/scop/templates/forms/parts/roll-bonus-dice.html",
        "systems/scop/templates/forms/parts/roll-bonus.html",
        "systems/scop/templates/forms/parts/roll-concepts.html",
        "systems/scop/templates/forms/parts/roll-powers.html",
        "systems/scop/templates/forms/parts/roll-chat-concept-bonus.html",
        "systems/scop/templates/forms/parts/roll-chat-bonus-dice.html",
        "systems/scop/templates/forms/parts/roll-chat-bonus.html",
        "systems/scop/templates/forms/parts/limit-form.html",
    ]);
};
