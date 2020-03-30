const fs = require('fs').promises;
const _ = require('lodash');
ENCODING = 'utf8';

// Functions

// Global Aux Functions


const iterator = (element) => {
    var next = 0;
    return {
        next: function () {
            return next === element.length ?
                { value: element[next++], done: true } :
                { value: element[next++], done: false };
        }
    }
}

const myTrim = (string) => {
    end = false;
    found = false;
    var it = iterator(string);
    x = '';
    while (!end) {
        letter = it.next()
        end = letter.done;
        if (!end) {
            if (!found && letter.value !== ' ') { found = true; }
            if (found) { x += _(letter).chain().pick('value').value().value; }
        }
    }
    return x
}

const joinList = (a, b) => a.reduce((x, y) => x + b + y)

const splitFunction = character => text => text.split(character)

const splitByDot = splitFunction('.')

const splitByNewLine = splitFunction('\n')

const joinFunction = character => array => array.join(character)

const joinByNewLine = joinFunction('\n')

const joinByEmpty = joinFunction('')

const composeFunctions = (f, g) => x => f(g(x))

const addCharacterAtStart = character => repetitions => text => character.repeat(repetitions) + text

const validatePhrase = n => length => length <= n

const countPhrases = phrasesArray => phrasesArray.length

const filterPhrases = phrasesArray => phrasesArray.filter(phrase => phrase.trim() !== '')

const validateParagraph = n => text => _.flowRight([validatePhrase(n), countPhrases, filterPhrases, splitByDot])(text) // Pipe & Currying

const addSpacesNTimes = addCharacterAtStart(' ')

const deleteEnd = times => text => text.slice(0, text.length - times)

const addNewLine = addCharacterAtStart('\n\n')(1) // Once


//this function get a list of words and recursibly generate
//list of lines no longer than n. if find a word longer than n the funcition retrun error message
const buildLines = (words, n, currentLine = "", lines = []) => {
    if (words.length === 0) {
        lines.push(currentLine)
        return lines
    }
    if (words[0].length > n) {
        lines.push(currentLine.trim())
        lines.push(words[0])
        return buildLines(_.drop(words), n, "", lines)
    }
    if (currentLine.length + words[0].length <= n) {
        currentLine += words[0] + " "
        return buildLines(_.drop(words), n, currentLine, lines)
    }
    lines.push(currentLine.trim())
    return buildLines(words, n, "", lines)
}

const applyToParagraph = (text, f) =>
    text.split("\n\n").map(paragraph => f(paragraph)).join("\n\n")

const atLeastNPhrasesFunction = (n) => paragraph => paragraph.split(".").length > n


// FUNCIONES DE LA TAREA

// A. después de cada punto seguido n espacios
const aFunction = (text, n) => {
    spaces = text.search(/\S|$/)
    list = text.split('.').map(a => (a[0] !== '\n') ? ' '.repeat(n) + myTrim(a) : a)
    text = (list[list.length - 1] === '') ? joinList(_.dropRight(list), '.') + '.' : joinList(list, '.');
    return ' '.repeat(spaces) + ((text[0] !== '\n') ? text.slice(n, text.length) : text);
}

// B. después de cada punto aparte, n espacios
const bFunction = (text, n) => deleteEnd(n + 1)(joinByEmpty(_.compact(splitByNewLine(text)).map(a => a + '\n'.repeat(n + 1))));


// C El ancho del texto debe ser a lo más n (sin cortar palabras)
const cFunction = (text, n) =>
    applyToParagraph(text,
        (paragraph) =>
            buildLines(paragraph.split(" "), n)
                .join("\n")
    )


/**
  D. Cada párrafo debe tener n espacios de sangría

    Currying (función addSpacesNTimes)
    Chaining
    Compose
*/

const dFunction = (text, n) =>
    composeFunctions(
        joinByNewLine,
        t => splitByNewLine(t).map(p => p.trim() !== '' ? addSpacesNTimes(n)(p.trimLeft()) : p)
    )(text)

// E Se ignoran los párrafos que tienen menos de n frases
const eFunction = (text, n) =>
    text.split("\n\n").filter(atLeastNPhrasesFunction(n)).join("\n\n")


/**
  F. Se ignoran los párrafos que tienen más de n frases

    Currying
    Pipe / Composition / Lodash (_.flowRight)
*/

const fFunction = (text, n) =>
    composeFunctions(
        joinByNewLine,
        t => splitByNewLine(t).filter(p => p.trim() === '' || validateParagraph(n)(p))
    )(text)

/**
  G. Cada frase debe aparecer en párrafo aparte
*/


const gFunction = text =>
    composeFunctions(
        joinByEmpty,
        t => splitByDot(t).map(
            (p, index) => ((index !== 0) && p.trim().length && (p.search('\n') === -1))
                ? addNewLine(p.trim())
                : p
        )
    )(text)

// H Solo las primeras n frases de cada párrafo
const hFunction = (text, n) =>
    applyToParagraph(text,
        (paragraph) =>
            _.take(
                _.dropRight(
                    paragraph
                        .split(".")), n)
                .join(".") + "."
    )



// Pruebas

fs.readFile('testText.txt', ENCODING).then(async (text) => {
    d = await aFunction(text, 5)
    return d
}).then((text) => fs.writeFile('testText2.txt', text))

