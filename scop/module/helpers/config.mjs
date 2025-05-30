export const SCOP = {};

export function registerSettings() {

    game.settings.register("scop", "diceType", {
        name: game.i18n.localize("SETTINGS.DiceType"),
        hint: game.i18n.localize("SETTINGS.DiceTypeHint"),
        scope: "world",
        type: String,
        choices: {
            "a": "d6",
            "b": "d8",
            "c": "d10",
            "d": "d12"
        },
        default: "c",
        config: true
    });

    game.settings.register("scop", "useDramaDice", {
        name: game.i18n.localize("SETTINGS.UseDramaDice"),
        hint: game.i18n.localize("SETTINGS.UseDramaDiceHint"),
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("scop", "usePower", {
        name: game.i18n.localize("SETTINGS.UsePower"),
        hint: game.i18n.localize("SETTINGS.UsePowerHint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

    game.settings.register("scop", "newDiceRoll", {
        name: game.i18n.localize("SETTINGS.NewDiceRoll"),
        hint: game.i18n.localize("SETTINGS.NewDiceRollHint"),
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

}
