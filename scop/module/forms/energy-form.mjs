export class ScopEnergyForm extends FormApplication {

    /** @override */
    constructor(actor, caller=undefined) {
        super();
        this.actor = actor;
        if (caller != undefined) {
            this.caller = caller;
            this.caller.deactivate();
        }
    }

    /** @override */
    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            classes: [ "scop", "sheet", "form" ],
            height: 'auto',
            id: 'energy-form',
            template: "systems/scop/templates/forms/energy-form.html",
            title: game.i18n.localize("SCOP.Energy")
        };
        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
        return mergedOptions;
    }

    /** @override */
    get template() {
        return `systems/scop/templates/forms/energy-form.html`;
    }

    /** @override */
    getData() {
        const context = super.getData();
        const actorData = this.actor.toObject(false);
        context.actor = actorData;
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

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        $('#decrease').click(this._onDecrease.bind(this));
        $('#increase').click(this._onIncrease.bind(this));
        $('#max-decrease').click(this._onMaxDecrease.bind(this));
        $('#max-increase').click(this._onMaxIncrease.bind(this));
    }

    async _onDecrease(event) {
        event.preventDefault();
        this.actor = await this.actor.decrease(this.actor.system.energy);
        this.render(true);
    }

    async _onIncrease(event) {
        event.preventDefault();
        this.actor = await this.actor.increase(this.actor.system.energy);
        this.render(true);
    }

    async _onMaxDecrease(event) {
        event.preventDefault();
        this.actor = await this.actor.maxDecrease(this.actor.system.energy);
        this.render(true);
    }

    async _onMaxIncrease(event) {
        event.preventDefault();
        this.actor = await this.actor.maxIncrease(this.actor.system.energy);
        this.render(true);
    }

}
