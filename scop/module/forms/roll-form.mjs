import { ScopRoll, EffortRoll } from "../rolls/scop-roll.mjs";


async function _sendChatMessage(template_file, data) {
    const rendered_html = await renderTemplate(template_file, data);
    const speaker = ChatMessage.getSpeaker({ actor: data.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        content: rendered_html
    });
}


class ScopRollBaseForm extends FormApplication {

    /** @override */
    constructor(actor, caller) {
        super();
        this.actor = actor;
        this.name = "";
        this._getConcepts();
        this.useConcepts = true;
        this.useBonusDice = true;
        this.useBonus = true;
        this.conceptBonus = 0;
        this.bonusDice = 0;
        this.bonus = 0;
        this.totalBonus = 0;
        this.finalResult = 0;
        if (caller != undefined) {
            this.caller = caller;
            this.caller.deactivate();
        }
    }

    _getConcepts() {
        this.concepts = [];
        for (let i of this.actor.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type == 'concept') {
                const concept = { concept: i, use: 0 };
                this.concepts.push(concept);
            }
        }
    }

    /** @override */
    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            classes: [ "scop", "sheet", "form" ],
            height: 'auto',
            id: 'roll-form',
            template: "systems/scop/templates/forms/roll-form.html",
            title: game.i18n.localize("SCOP.Roll.Rolling")
        };
        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
        return mergedOptions;
    }

    /** @override */
    get template() {
        return `systems/scop/templates/forms/roll-form.html`;
    }

    /** @override */
    getData() {
        const context = super.getData();
        const actorData = this.actor.toObject(false);

        // Teste para ver os dados do usuário:
        context.actor = actorData;
        context.name = this.name;
        context.concepts = this.concepts;
        context.useConcepts = this.useConcepts;
        context.useBonusDice = this.useBonusDice;
        context.useBonus = this.useBonus;
        context.conceptBonus = this.conceptBonus;
        context.bonusDice = this.bonusDice;
        context.bonus = this.bonus;
        context.useCost = this._getUseCost();
        context.effortCost = this._getEffortCost();
        context.mainRoll = this.mainRoll;
        context.finalResult = this.finalResult;
        context.totalBonus = this.totalBonus;
        context.system = actorData.system;
        context.flags = actorData.flags;
        return context;
    }

    /** @override */
    async close(...args) {
        if (this.caller != undefined) {
            this.caller.activate();
            this.caller = undefined;
        }
        super.close(...args);
    }

    _getSkillLevel() {
        return 0;
    }

    _getAdditionalBonus() {
        return 0;
    }

    _getUseCost() {
        return 0;
    }

    _getEffortCost() {
        return 1;
    }

    _resetBonus() {
        this._getConcepts();
        this.useConcepts = false;
        this.useBonusDice = false;
        this.useBonus = false;
        this.conceptBonus = 0;
        this.bonusDice = 0;
        this.bonus = 0;
        this.totalBonus = 0;
    }

    _applyConcepts() {
        this.conceptBonus = 0;
        this.useConcepts = false;
        for (let i of this.concepts) {
            if (i.use != 0) {
                this.conceptBonus = this.conceptBonus + i.use;
                this.useConcepts = true;
            }
        }
        return this.conceptBonus;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.use-concept').click(this._onUseConcept.bind(this));
        $('#bonus-dice-decrease').click(this._onBonusDiceDecrease.bind(this));
        $('#bonus-dice-increase').click(this._onBonusDiceIncrease.bind(this));
        $('#bonus-decrease').click(this._onBonusDecrease.bind(this));
        $('#bonus-increase').click(this._onBonusIncrease.bind(this));
        $('#roll').click(this._onRoll.bind(this));
    }

    _onUseConcept(event) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data("itemId");
        for (let i of this.concepts) {
            if (i.concept._id == itemId) {
                if (i.use < 0) {
                    i.use = 0;
                } else if (i.use == 0) {
                    i.use = i.concept.system.value;
                } else {
                    i.use = - i.concept.system.value;
                }
            }
        }
        this.render(true);
    }

    _onBonusDiceDecrease(event) {
        event.preventDefault();
        this.bonusDice = this.bonusDice - 1;
        this.render(true);
    }

    _onBonusDiceIncrease(event) {
        event.preventDefault();
        this.bonusDice = this.bonusDice + 1;
        this.render(true);
    }

    _onBonusDecrease(event) {
        event.preventDefault();
        this.bonus = this.bonus - 1;
        this.render(true);
    }

    _onBonusIncrease(event) {
        event.preventDefault();
        this.bonus = this.bonus + 1;
        this.render(true);
    }

    async _onRoll(event) {
        event.preventDefault();
        const rollData = this.actor.getRollData();
        const testLevel = this._getSkillLevel() + this._applyConcepts() + this.bonusDice;
        const additionalBonus = this._getAdditionalBonus();
        this.totalBonus = this.bonus + additionalBonus;

        this.mainRoll = new ScopRoll(testLevel, this.totalBonus, rollData);
        await this.mainRoll.roll();
        this.finalResult = this.mainRoll.result;

        const template_file = "systems/scop/templates/forms/roll-chat.html";
        const context = this.getData();
        await _sendChatMessage(template_file, context);
        this.close();
    }

}


export class ScopNoSkillRollForm extends ScopRollBaseForm {

    constructor(actor, caller=undefined) {
        super(actor, caller);
        this.name = game.i18n.localize("SCOP.Roll.NoSkill");
        this.useConcepts = true;
        this.useBonusDice = true;
        this.useBonus = true;
    }

}


export class ScopNoPowerSkillRollForm extends ScopRollBaseForm {

    constructor(actor, powerItem, caller=undefined) {
        super(actor, caller);
        this.name = game.i18n.localize("SCOP.Roll.NoSkill");
        this.power = powerItem;
        this.useConcepts = false;
        this.useBonusDice = false;
        this.useBonus = false;
        this.usePower = false;
    }

    getData() {
        const context = super.getData();
        context.power = this.power;
        context.usePower = this.usePower;
        return context;
    }

    _resetBonus() {
        super._resetBonus()
        this.usePower = false;
    }

    _applyConcepts() {
        return 0;
    }

    _applyPower() {
        if (this.usePower) {
            return this.power.system.value;
        } else {
            return 0;
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        $('#use-power').click(this._onUsePower.bind(this));
    }

    _onUsePower(event) {
        event.preventDefault();
        this.usePower = !this.usePower;
        this.render(true);
    }

    _getSkillLevel(event) {
        return -1;
    }

    _getUseCost() {
        return 1;
    }

    _getEffortCost() {
        return 1;
    }

    _getAdditionalBonus() {
        return this._applyPower();
    }

    async _onRoll(event) {
        super._onRoll(event);
        this.actor.decrease(this.actor.system.energy, 1);
    }

}


export class ScopSkillRollForm extends ScopRollBaseForm {

    constructor(actor, skillItem, caller=undefined) {
        super(actor, caller);
        this.name = skillItem.name;
        this.skill = skillItem;
    }

    getData() {
        const context = super.getData();
        context.skill = this.skill;
        return context;
    }

    _resetBonus() {
        super._resetBonus()
    }

    _getSkillLevel() {
        return this.skill.system.value;
    }

    _getEffortCost() {
        return 1;
    }

}


export class ScopPowerSkillRollForm extends ScopRollBaseForm {

    constructor(actor, skillItem, powerItem, caller=undefined) {
        super(actor, caller);
        this.name = skillItem.name;
        this.skill = skillItem;
        this.power = powerItem;
        this.usePower = false;
    }

    getData() {
        const context = super.getData();
        context.skill = this.skill;
        context.power = this.power;
        context.usePower = this.usePower;
        return context;
    }

    _resetBonus() {
        super._resetBonus()
        this.usePower = false;
    }

    _applyPower() {
        if (this.usePower) {
            return this.power.system.value;
        } else {
            return 0;
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        $('#use-power').click(this._onUsePower.bind(this));
    }

    _onUsePower(event) {
        event.preventDefault();
        this.usePower = !this.usePower;
        this.render(true);
    }

    _getSkillLevel() {
        return this.skill.system.value;
    }

    _getUseCost() {
        return 1;
    }

    _getEffortCost() {
        return 1;
    }

    _getAdditionalBonus() {
        return this._applyPower();
    }

    async _onRoll(event) {
        super._onRoll(event);
        this.actor.decrease(this.actor.system.energy, 1);
    }
}


export class ScopEffortRoll {

    constructor(event) {
        const li = $(event.currentTarget).closest("li");
        this.messageId = li.data("messageId");
        this.message = this._getMessage(this.messageId);
        this.button = $(this.message.content).find("#effort");
        this.actorId = $(this.button).data("actorId");
        this.actor = this._getActor(this.actorId);
        this.previousResult = this._getPreviousResult();
        this.diceNumber = this._getRerollDice();
        this.totalBonus = this._getTotalBonus();
        this.effortCost = this._getEffortCost();
    }

    _getMessage(messageId) {
        return game.messages.get(messageId);
    }

    _getActor(actorId) {
        return game.actors.get(actorId);
    }

    _getPreviousResult() {
        return $(this.button).data("previousResult");
    }

    _getRerollDice() {
        return $(this.button).data("rerollDice");
    }

    _getTotalBonus() {
        return $(this.button).data("totalBonus");
    }

    _getEffortCost() {
        return $(this.button).data("effortCost");
    }

    async roll() {
        const rollData = this.actor.getRollData();
        this.effortRoll = new EffortRoll(this.diceNumber, this.totalBonus, rollData);
        await this.actor.decrease(this.actor.system.energy, 1);
        await this.effortRoll.roll();
        this.effortBonus = this.effortRoll.result;
        this.finalResult = this.previousResult + this.effortBonus + this.totalBonus;
        await _sendChatMessage("systems/scop/templates/forms/effort-chat.html", this);
    }

    async updateChatMessage() {
        const content = $(this.message.content);
        const button = $(content).find("#effort");
        if (this.actor.system.energy.value >= this.effortCost) {
            this.roll();
            $(button).prop("disabled", true);
        } else {
            $(button).after('<div class="roll-no-energy">'
                            + game.i18n.localize("SCOP.Roll.NoEnergy") + '</div>');
        }

        // I don't like this, but I couldn't find another way to make jQuery concatenate the HTML for a
        // sequence of HTML tags.
        var ptext = "";
        for (var p of $(content)) {
            if (p.outerHTML) {
                ptext += p.outerHTML + "\n";
            }
        }
        this.message.update({ _id: this.messageId, content: ptext });
    }
}
