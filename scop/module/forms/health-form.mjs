export class ScopHealthForm extends FormApplication {

    /** @override */
    constructor(actor) {
        super();
        this.actor = actor;
    }

    /** @override */
    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            classes: [ "scop", "sheet", "form" ],
            height: 'auto',
            id: 'health-form',
            template: "systems/scop/templates/forms/health-form.html",
            title: game.i18n.localize("SCOP.Vitality")
        };
        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
        return mergedOptions;
    }

    /** @override */
    get template() {
        return `systems/scop/templates/forms/health-form.html`;
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
    activateListeners(html) {
        super.activateListeners(html);
        $('#decrease').click(this._onDecrease.bind(this));
        $('#increase').click(this._onIncrease.bind(this));
        $('#max-decrease').click(this._onMaxDecrease.bind(this));
        $('#max-increase').click(this._onMaxIncrease.bind(this));
    }

    async _onDecrease(event) {
        event.preventDefault();
        this.actor = await this.actor.decrease(this.actor.system.health);
        this.render(true);
    }

    async _onIncrease(event) {
        event.preventDefault();
        this.actor = await this.actor.increase(this.actor.system.health);
        this.render(true);
    }

    async _onMaxDecrease(event) {
        event.preventDefault();
        this.actor = await this.actor.maxDecrease(this.actor.system.health);
        this.render(true);
    }

    async _onMaxIncrease(event) {
        event.preventDefault();
        this.actor = await this.actor.maxIncrease(this.actor.system.health);
        this.render(true);
    }

}
