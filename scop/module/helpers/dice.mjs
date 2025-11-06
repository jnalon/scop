function formatValidDice(value, cutValue) {
    if (value <= cutValue) {
        return 'valid-dice';
    } else {
        return 'discarded-dice';
    }
}


function formatDramaDice(drama, diceType, cutValue) {
    const use_drama = game.settings.get("scop", "useDramaDice");
    if (!use_drama) {
        return "";
    } else if (drama == cutValue) {
        return "good-drama-dice";
    } else if (drama == diceType) {
        return "bad-drama-dice";
    } else {
        return "drama-dice";
    }
}


export function printOldDice(valid, discard, drama, diceType, cutValue) {
    const main_roll = valid.concat(discard);
    const drama_index = main_roll.indexOf(drama);
    var drama_printed = false;
    var result = '<div class="flexrow flex-group-center roll-results">';
    for (let index=0; index < main_roll.length; index++) {
        const value = main_roll[index];
        const valid_style = formatValidDice(value, cutValue);
        var drama_style = '';
        if (value == drama && !drama_printed) {
            drama_style = formatDramaDice(drama, diceType, cutValue);
            drama_printed = true;
        }
        result += `<span class="${valid_style} ${drama_style}">${value}</span>`;
    }
    result += '</div>';
    return result;
}


export function printDice(valid, discard, drama, diceType, cutValue, isPenalty) {
    var result = '<div class="flexrow flex-group-center roll-results">';
    const drama_style = formatDramaDice(drama, diceType, cutValue);
    if (drama > 0) {
        if (drama <= cutValue) {
            result += `<span class="valid-dice ${drama_style}">${drama}</span>`;
        } else {
            result += `<span class="discarded-dice ${drama_style}">${drama}</span>`;
        }
    }
    const support_style = isPenalty? 'penalty-dice' : 'support-dice';
    for (let value of valid) {
        result += `<span class="valid-dice ${support_style}">${value}</span>`;
    }
    for (let value of discard) {
        result += `<span class="discarded-dice ${support_style}">${value}</span>`;
    }
    result += '</div>';
    return result;
}
