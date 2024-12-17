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
            "c": "d10"
        },
        default: "c",
        config: true
    });

}
