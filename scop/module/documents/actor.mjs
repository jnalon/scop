/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the
 * Simple system.
 * @extends {Actor}
 */
export class ScopActor extends Actor {

    _filterItems(type) {
        return this.items.filter((item) => item.type === type);
    }

    getConcepts() {
        return this._filterItems("concept");
    }

    getSkills() {
        return this._filterItems("skill");
    }

    async adjust(condition, new_value, field) {
        const key = `system.${condition.type}.${field}`
        return this.update({ _id: this._id, [key]: new_value });
    }

    async decrease(condition, delta=1) {
        const new_value = Math.max(0, condition.value - delta);
        return this.adjust(condition, new_value, "value");
    }

    async increase(condition, delta=1) {
        const new_value = Math.min(condition.value + delta, condition.max);
        return this.adjust(condition, new_value, "value");
    }

    // Updating on different fields in the `Actor` should be done all at the same time, or some
    // side effects might appear.
    async maxDecrease(condition, delta=1) {
        const new_max = Math.max(condition.max - delta, 0);
        const new_value = Math.min(condition.value, new_max);
        const value_key = `system.${condition.type}.value`;
        const max_key = `system.${condition.type}.max`;
        return this.update({ _id: this._id, [value_key]: new_value, [max_key]: new_max });
    }

    async maxIncrease(condition, delta=1) {
        const new_max = condition.max + delta;
        return this.adjust(condition, new_max, "max");
    }

}
