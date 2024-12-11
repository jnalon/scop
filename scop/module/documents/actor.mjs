/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the
 * Simple system.
 * @extends {Actor}
 */
export class ScopActor extends Actor {

    /** @override */
    prepareData() {
        super.prepareData();
    }

    /** @override */
    prepareBaseData() {
    }

    /** @override */
    prepareDerivedData() {
        const flags = this.flags.scop || { };
        if (this.type == 'character') this._prepareCharacterData();
    }

    /** @private */
    async _prepareCharacterData() {
    }

    /** @override */
    getRollData() {
        const data = super.getRollData();
        this._getCharacterRollData(data);
        return data;
    }

    /** @private */
    _getCharacterRollData(data) {
        if (this.type !== 'character') return;
    }

    async decrease(condition, value=1) {
        let new_value = condition.value - value;
        if (new_value < condition.min) {
            new_value = condition.value;
        }
        if (condition.type == "health") {
            return this.update({ _id: this._id, "system.health.value": new_value });
        } else if (condition.type == "energy") {
            return this.update({ _id: this._id, "system.energy.value": new_value });
        } else {
            return this;
        }
    }

    async increase(condition, value=1) {
        let new_value = condition.value + value;
        if (new_value > condition.max) {
            new_value = condition.max;
        }
        if (condition.type == "health") {
            return this.update({ _id: this._id, "system.health.value": new_value });
        } else if (condition.type == "energy") {
            return this.update({ _id: this._id, "system.energy.value": new_value });
        } else {
            return this;
        }
    }

    async maxDecrease(condition, value=1) {
        if (condition.max <= 0) {
            return this;
        } else {
            const new_max = condition.max - value;
            let new_value = condition.value;
            if (new_value > new_max) {
                new_value = new_max;
            }
            if (condition.type == "health") {
                return this.update({ _id: this._id, "system.health.value": new_value, "system.health.max": new_max });
            } else if (condition.type == "energy") {
                return this.update({ _id: this._id, "system.energy.value": new_value, "system.energy.max": new_max });
            }
        }
    }

    async maxIncrease(condition, value=1) {
        const new_max = condition.max + 1;
        if (condition.type == "health") {
            return this.update({ _id: this._id, "system.health.max": new_max });
        } else if (condition.type == "energy") {
            return this.update({ _id: this._id, "system.energy.max": new_max });
        }
    }

}
