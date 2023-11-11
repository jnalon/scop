const CUT_VALUE = 4;
const BASE_DICE = 2;
const BASE_TYPE = "d10";

class ScopBaseRoll extends Roll {

    /** @override */
    constructor(diceNumber, bonus, rollData) {
        const formula = `${diceNumber}${BASE_TYPE}`;
        super(formula, rollData);
        this.bonus = bonus;
        this.drama = 0;
        this.valid = new Array();
        this.discard = new Array();
    }

    /** @override */
    async roll(options) {
        super.roll(options);
        this.drama = this.dice[0].results[0].result;
        for (let die of this.dice[0].results) {  // TODO: Ugly, there might be another way.
            if (die.result <= CUT_VALUE) {
                this.valid.push(die.result);
            } else {
                this.discard.push(die.result);
            }
        }
        this.valid = this.valid.sort((a, b) => { return a - b });
        this.discard = this.discard.sort((a, b) => { return a - b });
    }

}


export class ScopRoll extends ScopBaseRoll {

    /** @override */
    constructor(testLevel, bonus, rollData) {
        const diceNumber = testLevel + BASE_DICE;
        super(diceNumber, bonus, rollData);
    }

    /** @override */
    get result() {
        if (this.valid.length > 0) {
            const successes = this.valid.length;
            const lastIndex = this.valid.length - 1;
            const baseValue = this.valid[lastIndex];
            return baseValue + (successes - 1) + this.bonus;
        } else {
            return 0;
        }
    }

}


export class EffortRoll extends ScopBaseRoll {

    /** @override */
    constructor(diceNumber, bonus, rollData) {
        super(diceNumber, bonus, rollData);
    }

    /** @override */
    get result() {
        if (this.valid.length > 0) {
            return this.valid.length + this.bonus;
        } else {
            return 0;
        }
    }

}
