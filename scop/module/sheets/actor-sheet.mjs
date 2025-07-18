import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { ScopHealthForm } from "../forms/health-form.mjs";
import { ScopEnergyForm } from "../forms/energy-form.mjs";
import { ScopNoSkillRollForm, ScopSkillRollForm, ScopNoPowerSkillRollForm, ScopPowerSkillRollForm,
         ScopEquipmentUseRollForm } from "../forms/roll-form.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ScopActorSheet extends ActorSheet {

    constructor(object={}, options={}) {
        super(object, options);
        this._active = true;
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: [ "scop", "sheet", "actor" ],
            template: "systems/scop/templates/actor/actor-sheet.html",
            width: 600,
            height: 900,
            popOut: true,
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
        const conditions = [];
        const skills = [];
        const powers = [];
        const powersMap = new Map();
        const equipment = [];
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type == 'concept') {
                concepts.push(i);
            } else if (i.type == 'condition') {
                conditions.push(i);
            } else if (i.type == 'skill') {
                skills.push(i);
            } else if (i.type == 'power') {
                i.skills = [ ];
                powers.push(i);
                powersMap.set(i.system.powerId, i);
            } else if (i.type == 'powerskill') {
                if (powersMap.has(i.system.powerId)) {
                    powersMap.get(i.system.powerId).skills.push(i);
                }
            } else if (i.type == 'equipment') {
                equipment.push(i);
            }
        }
        for (let power of powers) {
            power.skills = power.skills.sort((a, b) => { return a.name.localeCompare(b.name) });
        }
        context.concepts = concepts;
        context.conditions = conditions;
        context.skills = skills.sort((a, b) => { return a.name.localeCompare(b.name) });
        context.powers = powers;
        context.equipment = equipment;
    }

    deactivate() {
        this._active = false;
        this.render(true);
    }

    activate() {
        this._active = true;
        this.render(true);
    }

    /** @override */
    activateListeners(html) {
        if (this._active) {
            super.activateListeners(html);
            $('.rollable').click(this._onRoll.bind(this));
            $('.no-power-skill').click(this._onNoPowerSkillRoll.bind(this));
            $('.special-use').click(this._onSpecialAbilityUse.bind(this));
            if (this.isEditable) {
                $('.item-create').click(this._onItemCreate.bind(this));
                $('.item-edit').click(this._onItemEdit.bind(this));
                $('.item-decrease').click(this._onItemDecrease.bind(this));
                $('.item-increase').click(this._onItemIncrease.bind(this));
                $('.item-delete').click(this._onItemDelete.bind(this));
                $('.condition-edit').click(this._onConditionEdit.bind(this));
                $('.condition-decrease').click(this._onConditionDecrease.bind(this));
                $('.condition-increase').click(this._onConditionIncrease.bind(this));
            }
        }
    }

    /** @private */
    _getActorId(event) {
        const form = $(event.currentTarget).parents("form");
        const _id = form.data("actorId");
        return _id;
    }

    /** @private */
    _getItemType(event) {
        const li = $(event.currentTarget).parents(".item");
        const type = li.data("type");
        return type;
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
    _getItemName(event) {
        const item = this._getItem(event);
        const name = item.name;
        return name;
    }

    /** @private */
    _getPowerId(event) {
        const item = this._getItem(event);
        const powerId = item.system.powerId;
        return powerId;
    }

    /** @private */
    _getItemByPowerId(powerId) {
        for (let i of this.actor.items) {
            if (i.type == 'power' && i.system.powerId == powerId) {
                return i;
            }
        }
    }

    /** @private */
    async _onItemCreate(event) {
        // Needed when we have more than one sheet opened.
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }

        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = foundry.utils.duplicate(header.dataset);
        const name_map = {
            "concept": game.i18n.localize('SCOP.Concept.New'),
            "condition": game.i18n.localize('SCOP.Condition.New'),
            "skill": game.i18n.localize('SCOP.Skill.New'),
            "power": game.i18n.localize('SCOP.Power.New'),
            "powerskill": game.i18n.localize('SCOP.Power.NewSkill'),
            "equipment": game.i18n.localize('SCOP.Equipment.New')
        }
        const name = name_map[type];
        const itemData = {
            name: name,
            type: type,
            system: data
        };
        delete itemData.system["type"];

        let item = await Item.create(itemData, { parent: this.actor });
        await item.sheet.render(true, {}, this);
        if (item.type == "powerskill") {
            const powerId = this._getPowerId(event);
            item = await item.setPowerId(powerId);
        }
        return item;
    }

    /** @private */
    async _onItemEdit(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const item = this._getItem(event);
        await item.sheet.render(true, {}, this);
    }

    /** @private */
    async _onItemDecrease(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const item = this._getItem(event);
        item.decrease();
    }

    /** @private */
    async _onItemIncrease(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const item = this._getItem(event);
        item.increase();
    }

    /** @private */
    async _onItemDelete(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const item = this._getItem(event);
        item.delete();
    }

    /** @private */
    async _onConditionEdit(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const type = this._getItemType(event);
        if (type == "health") {
            const sheet = new ScopHealthForm(this.actor, this);
            await sheet.render(true);
        } else if (type == "energy") {
            const sheet = new ScopEnergyForm(this.actor, this);
            await sheet.render(true);
        }
    }

    /** @private */
    async _onConditionDecrease(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const type = this._getItemType(event);
        if (type == "health") {
            this.actor.decrease(this.actor.system.health);
        } else if (type == "energy") {
            this.actor.decrease(this.actor.system.energy);
        }
    }

    /** @private */
    async _onConditionIncrease(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const type = this._getItemType(event);
        if (type == "health") {
            this.actor.increase(this.actor.system.health);
        } else if (type == "energy") {
            this.actor.increase(this.actor.system.energy);
        }
    }

    async _onSpecialAbilityUse(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
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
    _onRoll(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const element = event.currentTarget;
        const dataset = element.dataset;
        if (!dataset.rollType) return;
        if (dataset.rollType == 'no-skill') {
            this._onNoSkillRoll(event);
        }
        if (dataset.rollType == 'skill') {
            const itemId = element.closest('.item').dataset.itemId;
            const item = this.actor.items.get(itemId);
            const sheet = new ScopSkillRollForm(this.actor, item, this);
            sheet.render(true);
        } else if (dataset.rollType == 'power-skill') {
            const itemId = element.closest('.item').dataset.itemId;
            const item = this.actor.items.get(itemId);
            const powerItem = this._getItemByPowerId(item.system.powerId);
            const sheet = new ScopPowerSkillRollForm(this.actor, item, powerItem, this);
            sheet.render(true);
        } else if (dataset.rollType == 'equipment-use') {
            const itemId = element.closest('.item').dataset.itemId;
            const item = this.actor.items.get(itemId);
            const sheet = new ScopEquipmentUseRollForm(this.actor, item, this);
            sheet.render(true);
        }
    }

    /** @private */
    _onNoSkillRoll(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const sheet = new ScopNoSkillRollForm(this.actor, this);
        sheet.render(true);
    }

    /** @private */
    _onNoPowerSkillRoll(event) {
        event.preventDefault();
        if (this._getActorId(event) != this.actor._id) {
            return;
        }
        const element = event.currentTarget;
        const dataset = element.dataset;
        if (!dataset.rollType) return;
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        const sheet = new ScopNoPowerSkillRollForm(this.actor, item, this);
        sheet.render(true);
    }

}
