/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ScopItem extends Item {

    /** @override */
    _onUpdate(...args) {
        this.setName(this.name.capitalize());
        if (this.type == 'power' && this.system.powerId == "") {
            this.setPowerId(this._id);
        }
        super._onUpdate(...args);
    }

    /** @override */
    prepareData() {
        super.prepareData();
    }

    /** @override */
    prepareDerivedData() {
        const img_map = {
            "concept": "icons/magic/holy/yin-yang-balance-symbol.webp",
            "condition": "icons/commodities/biological/organ-heart-red.webp",
            "skill": "icons/tools/smithing/hammer-sledge-steel-grey.webp",
            "power": "icons/magic/light/explosion-star-glow-silhouette.webp",
            "powerskill": "icons/magic/fire/beam-jet-stream-embers.webp",
            "equipment": "icons/containers/bags/pack-leather-black-brown.webp"
        };
        this.img = img_map[this.type] || this.img;
    }

    /** @override */
    getRollData() {
        if (!this.actor) {
            return null;
        }
        const rollData = this.actor.getRollData();
        rollData.item = foundry.utils.deepClone(this.system);
        return rollData;
    }

    async setName(name) {
        return this.update({ _id: this.id, "name": name });
    }

    async setPowerId(powerId) {
        return this.update({ _id: this._id, "system.powerId": powerId });
    }

    async adjust(delta, min=0, max=Infinity) {
        const new_value = Math.min(Math.max(min, this.system.value + delta), max);
        return this.update({ _id: this._id, "system.value": new_value });
    }

    async decrease(delta=1) {
        if (this.type == 'concept') {
            return this.adjust(-delta, 1);
        } else if (this.type == 'condition') {
            return this.adjust(-delta, this.system.min, this.system.max);
        } else if (this.type == 'power') {
            return this.adjust(-delta, -Infinity);
        } else if (this.type == 'skill') {
            return this.adjust(-delta, -Infinity);
        } else if (this.type == 'powerskill') {
            return this.adjust(-delta, -Infinity);
        } else if (this.type == 'equipment') {
            return this.adjust(-delta);
        } else {
            return this;
        }
    }

    async increase(delta=1) {
        const new_value = this.system.value + delta;
        if (this.type == 'condition') {
            return this.adjust(delta, this.system.min, this.system.max);
        } else {
            return this.update({ _id: this._id, "system.value": new_value });
        }
    }

    async maxDecrease(delta=1) {
        const new_max = Math.max(0, this.system.max - delta);
        const new_value = Math.min(this.system.value, new_max);
        return this.update({ _id: this._id, "system.value": new_value, "system.max": new_max });
    }

    async maxIncrease(delta=1) {
        const new_max = this.system.max + delta;
        return this.update({ _id: this._id, "system.max": new_max });
    }

    async costDecrease(delta=1) {
        let new_cost = this.system.cost - delta;
        new_cost = Math.max(1, new_cost);
        return this.update({ _id: this._id, "system.cost": new_cost });
    }

    async costIncrease(delta=1) {
        const new_cost = this.system.cost + delta;
        return this.update({ _id: this._id, "system.cost": new_cost });
    }

    async toggle() {
        const new_flag = !this.system.specialAbility;
        return this.update({ _id: this._id, "system.specialAbility": new_flag });
    }

}
