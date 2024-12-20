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
        if (this.type == "concept") {
            this.img = "icons/magic/holy/yin-yang-balance-symbol.webp";
        } else if (this.type == "condition") {
            this.img = "icons/commodities/biological/organ-heart-red.webp";
        } else if (this.type == "skill") {
            this.img = "icons/tools/smithing/hammer-sledge-steel-grey.webp";
        } else if (this.type == "power") {
            this.img = "icons/magic/light/explosion-star-glow-silhouette.webp";
        } else if (this.type == "powerskill") {
            this.img = "icons/magic/fire/beam-jet-stream-embers.webp";
        } else if (this.type == "equipment") {
            this.img = "icons/containers/bags/pack-leather-black-brown.webp";
        }
    }

    /** @override */
    getRollData() {
        if (!this.actor) return null;
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

    async decrease() {
        let new_value = this.system.value - 1;
        if (this.type == 'concept' && new_value < 1) {
            new_value = 1;
        } else if (this.type == 'condition' && new_value < this.system.min) {
            new_value = this.system.min;
        } else if (this.type == 'equipment' && new_value < 0) {
            new_value = 0;
        }
        return this.update({ _id: this._id, "system.value": new_value });
    }

    async increase() {
        const new_value = this.system.value + 1;
        if (this.type == 'condition' && new_value > this.system.max) {
            new_value = this.system.max;
        }
        return this.update({ _id: this._id, "system.value": new_value });
    }

    async costDecrease() {
        let new_cost = this.system.cost - 1;
        if (new_cost < 1) {
            new_cost = 1;
        }
        return this.update({ _id: this._id, "system.cost": new_cost });
    }

    async costIncrease() {
        const new_cost = this.system.cost + 1;
        return this.update({ _id: this._id, "system.cost": new_cost });
    }

    async maxDecrease() {
        if (this.system.max > 0) {
            const new_max = this.system.max - 1;
            let new_value = this.system.value;
            if (this.system.value > new_max) {
                new_value = new_max;
            }
            return this.update({ _id: this._id, "system.value": new_value, "system.max": new_max });
        } else {
            return this;
        }
    }

    async maxIncrease() {
        const new_max = this.system.max + 1;
        return this.update({ _id: this._id, "system.max": new_max });
    }

    async toggle() {
        const new_flag = !this.system.specialAbility;
        return this.update({ _id: this._id, "system.specialAbility": new_flag });
    }

}
