import { ScopRoll, EffortRoll } from "../rolls/scop-roll.mjs";

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
        this.effort = false;
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
            title: game.i18n.localize("SCOP.Rolling")
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
        context.actor = actorData;
        context.name = this.name;
        context.concepts = this.concepts;
        context.useConcepts = this.useConcepts;
        context.useBonusDice = this.useBonusDice;
        context.useBonus = this.useBonus;
        context.conceptBonus = this.conceptBonus;
        context.bonusDice = this.bonusDice;
        context.bonus = this.bonus;
        context.effort = this.effort;
        context.cost = this._getEffortCost();
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
        if (!this.effort) {
            html.find('.use-concept').click(this._onUseConcept.bind(this));
        }
        $('#bonus-dice-decrease').click(this._onBonusDiceDecrease.bind(this));
        $('#bonus-dice-increase').click(this._onBonusDiceIncrease.bind(this));
        $('#bonus-decrease').click(this._onBonusDecrease.bind(this));
        $('#bonus-increase').click(this._onBonusIncrease.bind(this));
        $('#roll').click(this._onRoll.bind(this));
        $('#effort').click(this._onEffort.bind(this));
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
        await this.mainRoll.roll({ async: true });
        this.finalResult = this.mainRoll.result;

        const template_file = "systems/scop/templates/forms/roll-chat.html";
        await this._sendChatMessage(template_file);

        if (this.mainRoll.discard.length == 0 || this.actor.system.energy.value < this._getEffortCost()) {
            this.close();
        } else {
            if (this.mainRoll.result > 0) {
                this._resetBonus();
            }
            this._getConcepts();
            this.useConcepts = false;
            this.conceptBonus = 0;
            this.effort = true;
            await this.render(true);
        }

    }

    async _onEffort(event) {
        event.preventDefault();
        const rollData = this.actor.getRollData();
        const diceNumber = this.mainRoll.discard.length;
        const additionalBonus = this._getAdditionalBonus();
        this.totalBonus = this.bonus + additionalBonus;

        this.effortRoll = new EffortRoll(diceNumber, this.totalBonus, rollData);
        await this.actor.decrease(this.actor.system.energy, this._getEffortCost());
        await this.effortRoll.roll({ async: true });
        this.effortBonus = this.effortRoll.result;
        this.finalResult = this.mainRoll.result + this.effortBonus;

        const template_file = "systems/scop/templates/forms/effort-chat.html";
        await this._sendChatMessage(template_file);
        this.close();
    }

    async _sendChatMessage(template_file) {
        const rendered_html = await renderTemplate(template_file, this);
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: rendered_html,
            content: ''
        });
    }

}


export class ScopNoSkillRollForm extends ScopRollBaseForm {

    constructor(actor, caller=undefined) {
        super(actor, caller);
        this.name = game.i18n.localize("SCOP.NoSkill");
        this.useConcepts = true;
        this.useBonusDice = true;
        this.useBonus = true;
    }

}


export class ScopNoPowerSkillRollForm extends ScopRollBaseForm {

    constructor(actor, powerItem, caller=undefined) {
        super(actor, caller);
        this.name = game.i18n.localize("SCOP.NoSkill");
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
        return this.skill.system.cost;
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

