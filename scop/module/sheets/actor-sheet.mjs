import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { ScopHealthForm } from "../forms/health-form.mjs";
import { ScopEnergyForm } from "../forms/energy-form.mjs";
import { ScopNoSkillRollForm, ScopConceptSkillRollForm, ScopRollForm, ScopNoPowerSkillRollForm } from "../forms/roll-form.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ScopActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: [ "scop", "sheet", "actor" ],
            template: "systems/scop/templates/actor/actor-sheet.html",
            width: 600,
            height: 900,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/scop/templates/actor";
        return `${path}/actor-${this.actor.type}-sheet.html`;
    }

    /** @override */
    getData() {
        const context = super.getData();
        const actorData = this.actor.toObject(false);
        context.system = actorData.system;
        context.flags = actorData.flags;

        if (actorData.type == 'character') {
            this._prepareItems(context);
            this._prepareCharacterData(context);
        }
        context.rollData = context.actor.getRollData();
        context.effects = prepareActiveEffectCategories(this.actor.effects);
        return context;
    }

    /** @private */
    _prepareCharacterData(context) {
    }

    /** @private */
    _prepareItems(context) {
        const concepts = [];
        const skills = [];
        const resources = [];
        const powers = [];
        const powersMap = new Map();
        const equipment = [];
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type == 'concept') {
                concepts.push(i);
            } else if (i.type == 'skill') {
                if (powersMap.has(i.system.ownerId)) {
                    powersMap.get(i.system.ownerId).skills.push(i);
                } else {
                    skills.push(i);
                }
            } else if (i.type == 'resource') {
                resources.push(i);
            } else if (i.type == 'power') {
                i.skills = [ ];
                powers.push(i);
                powersMap.set(i._id, i);
            } else if (i.type == 'equipment') {
                equipment.push(i);
            }
        }
        context.concepts = concepts;
        context.skills = skills;
        context.resources = resources;
        context.powers = powers;
        context.equipment = equipment;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        $('#no-skill').click(this._onNoSkillRoll.bind(this));
        $('#concept-skill').click(this._onConceptSkillRoll.bind(this));
        $('.rollable').click(this._onRoll.bind(this));
        $('.no-power-skill').click(this._onNoPowerSkillRoll.bind(this));
        $('.resource-use').click(this._onResourceUse.bind(this));
        $('.special-use').click(this._onSpecialAbilityUse.bind(this));
        if (this.isEditable) {
            $('.item-create').click(this._onItemCreate.bind(this));
            $('.item-edit').click(this._onItemEdit.bind(this));
            $('.item-decrease').click(this._onItemDecrease.bind(this));
            $('.item-increase').click(this._onItemIncrease.bind(this));
            $('.item-delete').click(this._onItemDelete.bind(this));
            $('.limit-edit').click(this._onLimitEdit.bind(this));
            $('.limit-decrease').click(this._onLimitDecrease.bind(this));
            $('.limit-increase').click(this._onLimitIncrease.bind(this));
        }
    }

     /** @private */
   _getItemId(event) {
        const li = $(event.currentTarget).parents(".item");
        const itemId = li.data("itemId");
        return itemId;
    }

    /** @private */
    _getItem(event) {
        const itemId = this._getItemId(event);
        const item = this.actor.items.get(itemId);
        return item;
    }

    /** @private */
    _getItemType(event) {
        const li = $(event.currentTarget).parents(".item");
        const type = li.data("type");
        return type;
    }

    /** @private */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = duplicate(header.dataset);
        let name = "";
        if (type == "concept") {
            name = game.i18n.localize('SCOP.NewConcept');
        } else if (type == "skill") {
            name = game.i18n.localize('SCOP.NewSkill');
        } else if (type == "resource") {
            name = game.i18n.localize('SCOP.NewResource');
        } else if (type == "power") {
            name = game.i18n.localize('SCOP.NewPower');
        } else if (type == "equipment") {
            name = game.i18n.localize('SCOP.NewEquipment');
        } else {
            name = game.i18n.localize('SCOP.New');
        }
        const itemData = {
            name: name,
            type: type,
            system: data
        };
        delete itemData.system["type"];

        let item = await Item.create(itemData, { parent: this.actor });
        await item.sheet.render(true);
        if (item.type == "skill") {
            const itemId = this._getItemId(event);
            item = await item.setOwnerID(itemId);
        }
        return item;
    }

    /** @private */
    async _onItemEdit(event) {
        event.preventDefault();
        const item = this._getItem(event);
        await item.sheet.render(true);
    }

    /** @private */
    async _onItemDecrease(event) {
        event.preventDefault();
        const item = this._getItem(event);
        item.decrease();
    }

    /** @private */
    async _onItemIncrease(event) {
        event.preventDefault();
        const item = this._getItem(event);
        item.increase();
    }

    /** @private */
    async _onItemDelete(event) {
        event.preventDefault();
        const item = this._getItem(event);
        item.delete();
    }

    /** @private */
    async _onLimitEdit(event) {
        event.preventDefault();
        const type = this._getItemType(event);
        if (type == "health") {
            const sheet = new ScopHealthForm(this.actor);
            await sheet.render(true);
        } else if (type == "energy") {
            const sheet = new ScopEnergyForm(this.actor);
            await sheet.render(true);
        }
    }

    /** @private */
    async _onLimitDecrease(event) {
        event.preventDefault();
        const type = this._getItemType(event);
        if (type == "health") {
            this.actor.decrease(this.actor.system.health);
        } else if (type == "energy") {
            this.actor.decrease(this.actor.system.energy);
        }
    }

    /** @private */
    async _onLimitIncrease(event) {
        event.preventDefault();
        const type = this._getItemType(event);
        if (type == "health") {
            this.actor.increase(this.actor.system.health);
        } else if (type == "energy") {
            this.actor.increase(this.actor.system.energy);
        }
    }

    /** @private */
    async _onResourceUse(event) {
        event.preventDefault();
        const item = await this._getItem(event).decrease();
        const template_file = "systems/scop/templates/forms/resource-chat.html";
        const rendered_html = await renderTemplate(template_file, item);
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: rendered_html,
            content: ''
        });
    }

    async _onSpecialAbilityUse(event) {
        event.preventDefault();
        if (this.actor.system.energy.value <= 0) return;
        await this.actor.decrease(this.actor.system.energy);
        const item = await this._getItem(event);
        const template_file = "systems/scop/templates/forms/special-ability-chat.html";
        const rendered_html = await renderTemplate(template_file, item);
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: rendered_html,
            content: ''
        });
    }

    /** @private */
    _onNoSkillRoll(event) {
        event.preventDefault();
        const sheet = new ScopNoSkillRollForm(this.actor);
        sheet.render(true);
    }

    /** @private */
    _onConceptSkillRoll(event) {
        event.preventDefault();
        const sheet = new ScopConceptSkillRollForm(this.actor);
        sheet.render(true);
    }

    /** @private */
    _onNoPowerSkillRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        if (!dataset.rollType) return;
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        const sheet = new ScopNoPowerSkillRollForm(this.actor, item);
        sheet.render(true);
    }

    /** @private */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        if (!dataset.rollType) return;
        if (dataset.rollType == 'skill') {
            const itemId = element.closest('.item').dataset.itemId;
            const item = this.actor.items.get(itemId);
            const ownerItem = this.actor.items.get(item.system.ownerId);
            const sheet = new ScopRollForm(this.actor, item, ownerItem);
            sheet.render(true);
        }
    }

}