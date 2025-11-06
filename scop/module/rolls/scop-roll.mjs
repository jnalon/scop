const DICE_TYPES = {
    "a": {
        "diceType": 6,
        "cutValue": 3
    },
    "b": {
        "diceType": 8,
        "cutValue": 3
    },
    "c": {
        "diceType": 10,
        "cutValue": 4
    },
    "d": {
        "diceType": 12,
        "cutValue": 4
    },
}

function getDiceData() {
    const diceCode = game.settings.get("scop", "diceType");
    return DICE_TYPES[diceCode];
}

function getDiceType() {
    const diceData = getDiceData();
    return diceData["diceType"];
}

function getCutValue() {
    const diceData = getDiceData();
    return diceData["cutValue"];
}


class ScopBaseRoll extends Roll {

    /** @override */
    constructor(diceNumber, bonus, rollData) {
        const diceType = getDiceType()
        const formula = `${diceNumber}d${diceType}`;
        super(formula, rollData);
        this.diceType = diceType;
        this.cutValue = getCutValue();
        this.bonus = bonus;
        this.drama = 0;
        this.valid = new Array();
        this.discard = new Array();
    }

    /** @override */
    async roll(options) {
        await super.roll(options);
        const dice = this.dice[0].results;
        this.drama = dice[0].result;
        for (let die of dice) {
            if (die.result <= this.cutValue) {
                this.valid.push(die.result);
            } else {
                this.discard.push(die.result);
            }
        }
        this.valid = this.valid.sort((a, b) => { return a - b });
        this.discard = this.discard.sort((a, b) => { return a - b });
    }

    getJSON() {
        const dice = this.dice[0].results;
        let throws = [ ];
        for (let die of dice) {
            throws.push({
                result: die.result,
                resultLabel: die.result,
                type: `d${this.diceType}`,
                vectors: [],
                options: {}
            });
        }
        const data = { throws: [ { dice: throws } ] };
        return data;
    }

}


export class ScopRoll extends ScopBaseRoll {

    /** @override */
    constructor(testLevel, bonus, rollData) {
        const diceNumber = testLevel + 1;
        super(diceNumber, bonus,  rollData);
    }

    /** @override */
    async roll(options) {
        await super.roll(options);
        this.valid = this._removeFirst(this.valid, this.drama);
        this.discard = this._removeFirst(this.discard, this.drama);
    }

    _removeFirst(arr, value) {
        let index = arr.indexOf(value);
        if (index !== -1) {
            arr.splice(index, 1);
        }
        return arr.sort((a, b) => { return a - b });
    }

    /** @override */
    get result() {
        const base = this.drama <= this.cutValue ? this.drama : 0;
        const raise = this.valid.length;
        return base + raise + this.bonus;
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
            return this.valid.length;
        } else {
            return 0;
        }
    }

}


export class OldScopRoll extends ScopBaseRoll {

    /** @override */
    constructor(testLevel, bonus, rollData) {
        const diceNumber = testLevel + 2;
        super(diceNumber, bonus, rollData);
    }

    /** @override */
    get result() {
        if (this.valid.length > 0) {
            const lastIndex = this.valid.length - 1;
            const baseValue = this.valid[lastIndex];
            const successes = this.valid.length - 1;
            return baseValue + successes + this.bonus;
        } else {
            return 0;
        }
    }

}
