const DICE_TYPES = {
    "a": {
        "diceType": 6,
        "cutValue": 3,
        "baseDice": 2
    },
    "b": {
        "diceType": 8,
        "cutValue": 3,
        "baseDice": 2
    },
    "c": {
        "diceType": 10,
        "cutValue": 4,
        "baseDice": 2
    },
    "d": {
        "diceType": 12,
        "cutValue": 4,
        "baseDice": 2
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

function getBaseDice() {
    const diceData = getDiceData();
    return diceData["baseDice"];
}



class ScopBaseRoll extends Roll {

    /** @override */
    constructor(diceNumber, bonus, rollData) {
        const diceType = getDiceType()
        const formula = `${diceNumber}d${diceType}`;
        super(formula, rollData);
        this.diceType = diceType;
        this.cutValue = getCutValue();
        this.baseDice = getBaseDice();
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
        const diceNumber = testLevel + getBaseDice();
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


// New dice roll
export class NewScopRoll extends Roll {

    /** @override */
    constructor(testLevel, bonus, rollData) {
        const diceNumber = testLevel + getBaseDice();
        const diceType = getDiceType()
        const formula = `${diceNumber}d${diceType}`;
        super(formula, rollData);
        this.diceType = diceType;
        this.cutValue = getCutValue();
        this.baseDice = getBaseDice();
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
        for (let die of dice.slice(1)) {
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

    /** @override */
    get result() {
        const base = this.drama <= this.cutValue ? this.drama : 0;
        const raise = this.valid.length;
        return base + raise + this.bonus;
    }

}
