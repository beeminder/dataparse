// Each element of this list is a test datapoint. Each test datapoint is a list 
// where the 0th element indicates whether the datapoint is valid. The remaining
// elements making up a test datapoint are concatenated with spaces interspersed
// to form the urtext. We then make sure that when we parse the urtext that it's
// validity matches the 0th element and that we get back the original elements
// when parsing it into date, value, and comment. For example, we have a line
// like [true, '^', 1] which yields urtext of '^ 1' and since that parses to a
// date of '^' of and a value of 1 with no comment, that means the initial
// "true" is correct, as are the '^' and 1 elements of the test datapoint.
const suite = [
[true,  '^', '-0:30', '"negative time!"'],
[false, '1', '123', 'maybe we shouldn\'t ought to need quotes for comments?'],
[true,  '^', '1', '"yay carets"'],
[true,  '^^', '.2'],
[true,  '31', '3.  ', '""'],
[false, '0', '4.5'],
[false, '-1', '6'],
[true,  '1', '-6'],
[true,  '31', '+6'],
[true,  '12 31', '0', '"you can optionally specify a month"'],
[false, '32', '123', '"regex can tell "32" is bad month"'],
[true,  '^', '01:30', '"values can be HH:MM:SS format"'],
[false, '^', '01:60', '"1st digit of minutes/seconds must be <6"'],
[true,  '^', ':90', '"unless the first part is 0; HT Darya"'],
[true,  '^', '01:02:03'],
[false, '^', '1:2', '"minutes and seconds have to be 2 digits"'],
[true,  '^^', ':01'],
[true,  '^', '10st9', '"british people weigh themselves in stones"'],
[true,  '2016 12 31', '00', '"or year and month"'],
[true,  '01 01', '000.2', '"leading zeros are fine"'],  
[false, '1969 12 31', '1234', '"only years 1970-2099 allowed"'],
[false, '99 6 6 ', '123', '"need 4-digit years"'],
[true,  '1 2', '3'],
[false, '2017 1 19.7', '0', '"fractional days not allowed"'],
[true,  '^', 1],
[false, 'not even any numbers'],
[false, '1'],
[true,  '2', '2'],
[false,  '3 3'],
]

/******************************************************************************
 *                              REGEX GENERATOR                               *
 ******************************************************************************/

// Helper for regexcat, turns regexes into strings so they can be concatenated
function stringify(x) {
  if (typeof(x)==="string") { return x }
  if (x instanceof RegExp)  { return x.source }
  //return JSON.stringify(x)
  return "ERROR--only-strings-and-regexes-allowed"
}

// Make a big regex by concatenating a list of regexes (and/or raw strings)
function regexcat(lor, opt) {            // opt is regex options like 'g' or 'i'
  return new RegExp(lor.map(x => stringify(x)).join(''), opt)
}    
// es5 version: 
// return new RegExp(lor.map(function(x) { return stringify(x) }).join(''), opt)
// es6 version: 
// return new RegExp(lor.map(x => stringify(x)).join(''), opt)

// Matches day of month (1-31 or 01-31), month (0?1-12), year (1970-2099)
var rday   = /(?:0?[1-9]|1\d|2\d|3[01])/
var rmonth = /(?:0?[1-9]|1[012])/
var ryear  = /(?:19[789]\d|20\d\d)/

// Matches a date in Beeminder format like "31" or "12 31" or "2016 12 31"
var rdate = regexcat(["(?:",                              rday, "|", 
                                           rmonth, /\s+/, rday, "|", 
                             ryear, /\s+/, rmonth, /\s+/, rday, ")"])
  
// Matches a real number, including all of these: 1 12 1. 1.1 .1
var rnumb = /(?:\d+\.?\d*|\.\d+)/  // digits + dot? + digits?  OR  dot + digits

// Matches a real number with an optional plus or minus in front
var rsnumb = regexcat([/[\+\-]?/, rnumb])

// Matches a British-style weight like "10st9" for 10 stone 9 pounds
var rock = regexcat([/\d+st/, rnumb, "?"]) // digits + "st" + numb?

// Matches times like "3:02" or "4:03:02" or "0:90" but not "1:90"
var rtime = /(?:\d*\:[0-5]\d(?:\:[0-5]\d)?|0?0?\:\d\d)/

// Matches a time with an optional plus or minus in front
var rstime = regexcat([/[\+\-]?/, rtime])

// Matches the datapoint value
var rval = regexcat([ rsnumb, "|", rstime, "|", rock ])

// Matches a double-quote (including curly ones)
var rquote = /[\"\u201c\u201d]/

// Matches a comment in Beeminder format. NB: allows quotes in the comment
var rcomment = regexcat([rquote, /.*/, rquote])

// Monster regex for matching a valid Beeminder datapoint
var rmonster = regexcat([
  /^\s*/,                               // match group numbers in []'s
  "(", rdate, "|", /\^+/, ")", /\s+/,   // [1] D | M D | Y M D | caret(s)
  "(", rval, ")",                       // [2] datapoint value
  "(?:", /\s+/, "(", rcomment, "))?",   // [3] comment with quotes
  /\s*$/,
])

/******************************************************************************
 *                               GENERATE HTML                                *
 ******************************************************************************/

const GREEN = '<font color="green">✔</font>'
const REDEX = '<font color="red">✖</font>'
const GRAYU = '<font color=#BBBBBB>undefined</font>'

// Return an html string for whether a datapoint is good or bad
//function showgb(s) { return rmonster.test(s) ? GREEN : REDEX }

// Takes datapoint urtext and returns an array [q, d, v, c] where q is whether 
// the urtext is parsable and d/v/c are the date/value/comment. If q is false
// then d/v/c will all be null.
function parse(u) {
  const marr = u.match(rmonster) // match array (0th element is the whole match)
  if (!marr || marr.length !== 4) { return [false, null, null, null] }
  const [, d, v, c] = marr
  return [true, d, v, c]
}

// Takes a test datapoint, a row of the suite table, and infer urtext
function urify(x) {
  let [, d, v, c] = x
  if (d === undefined) { d = '' }
  if (v === undefined) { v = '' }
  if (c === undefined) { c = '' }
  return [d, v, c].join(' ').trim()
}

// Takes datapoint urtext, inserts a row at position r in the table for it
function insertrow(u, r=1) { // I think default args are an es6 thing
  const row = document.getElementById("dptable").insertRow(r)
  const [q, d, v, c] = parse(u)
  ;[q ? GREEN : REDEX, u, d, v, c===undefined ? GRAYU : c].map(x =>
    row.insertCell(-1).innerHTML = (x===null ? '' : `<pre>${x}</pre>`))
}

// http://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffi
// Overclever version, also from that stackoverflow link:
// const s = ["th", "st", "nd", "rd"]; const v = n % 100
// return n + (s[(v-20)%10] || s[v] || s[0])
function ordinalize(n) {
  var d  = n % 10  // last digit
  var dd = n % 100 // last 2 digits
  if      (d === 1 && dd !== 11) { return n + "st" }
  else if (d === 2 && dd !== 12) { return n + "nd" }
  else if (d === 3 && dd !== 13) { return n + "rd" }
  else                           { return n + "th" }
}

let dcur = '' // current datapoint as typed so far
let lastpress = -1 // last keypress
let datapoint

const date = new Date()
const day = date.getDate()
$('#dfield').attr('placeholder', `${day} 123 `
  + `"optional comment about reporting 123 on the ${ordinalize(day)}"`)

suite.forEach(x => insertrow(urify(x), -1))

$('#rmonster').html(rmonster.source)
$('#smonster').html(JSON.stringify(rmonster.source))
const r = regexcat([/^\s*/, rval, /\s*$/]).source
$('#rmonsterv').html(r)
$('#smonsterv').html(JSON.stringify(r))

$('form').submit(event => {
  event.preventDefault()
  datapoint = $('input').val()
  insertrow(datapoint)
  $('input').val('')
  $('input').focus()
})

$('form').keydown(event => {
  if (event.which === 38 && lastpress !== 38) { // up-arrow: show last datapt
    lastpress = 38
    dcur = $('#dfield').val()
    $('#dfield').val(datapoint)
    return false // this makes the cursor go to the end for whatever reason
  } else if (event.which === 40) { // down-arrow: back to what user was typing
    lastpress = 40
    $('#dfield').val(dcur)
    return false
  } else { 
    lastpress = event.which
  }
})

/******************************************************************************
 *                                 TEST SUITE                                 *
 ******************************************************************************/

let ntest = 0 // count how many tests we do
let npass = 0 // count how many pass

// Takes a boolean assertion and a message string, prints a warning to the 
// browser console if the assertion is false. Also increment the test counter.
// (But mainly I wanted to just type "assert" instead of "console.assert")
function assert(test, msg) {
  ntest += 1
  npass += test
  console.assert(test, msg)
}

// Take a row from the test suite and trim whitespace and stingify and stuff
function canonicalize(x) {
  let [q, d, v, c] = x
  d = d.trim()
  v = typeof(v)==='string' ? v.trim() : typeof(v)==='number' ? v.toString() : v
  return [q, d, v, c]
}

// Whether an element of the test suite parses like it's supposed to
function checkit(x) {
  let [q, d, v, c] = canonicalize(x)
  const [q2, d2, v2, c2] = parse(urify(x))
  const match = (d===d2 && v===v2 && c===c2)
  return !q && !q2 ||          // expect !parse, got !parse; GOOD
         !q && q2 && !match || // expect !parse, parsed but differently; GOOD
         q && q2 && match      // expect parse, got parse, matches; GOOD
}

function testsuite() {
  ntest = npass = 0
  suite.forEach(x => {
    console.log(`${JSON.stringify(x)} -> ${checkit(x)}`)
    assert(checkit(x),
           `${JSON.stringify(urify(x))} should ${x[0] ? '' : 'fail to '}parse`)
  })
  return npass + "/" + ntest + " tests passed"
}
testsuite() // uncomment when testing and look in the browser console!

/******************************************************************************
 *                      STUFF WE'RE NOT CURRENTLY USING                       *
 ******************************************************************************/

/*

The original regex in beetils.js:
^\s*((?:(?:\d{1,4})\s+){1,3}|\^+\s+)((?:(?:\+|\-)?(?:\d+\.?\d*|\d*\.?\d+))|(?:\d
+st[\d\.]*)|(?:(\d+)\:(\d\d)(?:\:(\d\d))?))(\s+[\"\u201c\u201d].*?[\"\u201c\u201
d])?\s*$

Alys's proposal for just the datapoint value in Beedroid:
.compile("^\\s*((?:(?:\\+|\\-)?(?:\\d+\\.?\\d*|\\d*\\.?\\d+))|(?:(?:\\+|\\-)?(\\d+)\\:(\\d\\d)(?:\\:(\\d\\d))?)|(?:(?:\\+|\\-)?\\:(\\d\\d)(?:\\:(\\d\\d))?))\\s*$")

Alys:
/((?:[\+\-]?(?:\d+\.?\d*|\d*\.?\d+))|(?:(?:\+|\-)?(\d+)\:(\d\d)(?:\:(\d\d))?)|(?:(?:\+|\-)?\:(\d\d)(?:\:(\d\d))?))/
Dreev:
/[\+\-]?(?:\d+\.?\d*|\.\d+)|(?:\d*\:[0-5]\d(?:\:[0-5]\d)?|0?0?\:\d\d)/
*/

// ---------------------------------- 80chars --------------------------------->
