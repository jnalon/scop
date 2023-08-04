/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ScopItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: [ "scop", "sheet", "item" ],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/scop/templates/item";
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /** @override */
    async render(force, options={}, caller=undefined) {
        const value = super.render(force, options);
        if (caller != undefined) {
            this.caller = caller;
            this.caller.deactivate();
        }
        return value;
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
    getData() {
        const context = super.getData();
        const itemData = context.item;
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
            context.isActor = true;
        } else {
            context.isActor = false;
            if (this.item.type == 'powerskill') {
                context.powerList = [ ];
                for (let i of game.items) {
                    if (i.type == 'power') {
                        context.powerList.push(i)
                    }
                }
            }
        }
        context.system = itemData.system;
        context.flags = itemData.flags;
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        if (this.isEditable) {
            $("#delete").click(this._onItemDelete.bind(this));
            $("#decrease").click(this._onItemDecrease.bind(this));
            $("#increase").click(this._onItemIncrease.bind(this));
            $("#cost-decrease").click(this._onCostDecrease.bind(this));
            $("#cost-increase").click(this._onCostIncrease.bind(this));
            $("#max-decrease").click(this._onMaxDecrease.bind(this));
            $("#max-increase").click(this._onMaxIncrease.bind(this));
            $("#toggle").click(this._onToggle.bind(this));
            $("#text-toggle").click(this._onToggle.bind(this));
        }
    }

    /** @private */
    _onItemDelete(event) {
        event.preventDefault();
        if (this.item.type == "power") {
            this._removePowerSkills();
        }
        this.item.delete();
        this.render(false);
    }

    /** @private */
    _removePowerSkills() {
        if (!this.item.actor)
            return;
        const thisPowerId = this.item.system.powerId;
        for (let i of this.item.actor.items) {
            if (i.type == "powerskill" && i.system.powerId == thisPowerId) {
                i.delete();
            }
        }
    }

    /** @private */
    _onItemDecrease(event) {
        event.preventDefault();
        this.item.decrease();
    }

    /** @private */
    _onItemIncrease(event) {
        event.preventDefault();
        this.item.increase();
    }

    /** @private */
    _onCostDecrease(event) {
        event.preventDefault(false);
        if (this.item.type == "powerskill") {
            this.item.costDecrease();
        }
    }

    /** @private */
    _onCostIncrease(event) {
        event.preventDefault();
        if (this.item.type == "powerskill") {
            this.item.costIncrease();
        }
    }

    /** @private */
    _onMaxDecrease(event) {
        event.preventDefault(false);
        this.item.maxDecrease();
    }

    /** @private */
    _onMaxIncrease(event) {
        event.preventDefault();
        this.item.maxIncrease();
    }

    /** @private */
    _onToggle(event) {
        event.preventDefault();
        this.item.toggle();
    }

    /** @override */
    _onSubmit(event) {
        if (this.item.type == 'powerskill') {
            const powerId = $('#power-name').find(':selected').val();
            this.item.setPowerId(powerId);
        }
        super._onSubmit(event);
    }

}
