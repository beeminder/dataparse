// Helper for regexcat, turns regexes into strings so they can be concatenated
function stringify(x) {
  if (typeof(x)==="string") { return x }
  if (x instanceof RegExp)  { return x.source }
  //return JSON.stringify(x);
  return "error1041"; // only strings and regexes allowed
}

// Make a big regex by concatenating a list of regexes (and/or raw strings)
function regexcat(lor, opt) {            // opt is regex options like 'g' or 'i'
  return new RegExp(lor.map(function(x) { return stringify(x) }).join(''), opt);
}    // es6 version: return new RegExp(lor.map(x => stringify(x)).join(''), opt)

// Matches day of month (1-31 or 01-31), month (0?1-12), year (1970-2099)
var rday = /(?:0?[1-9]|1\d|2\d|3[01])/;
var rmon = /(?:0?[1-9]|1[012])/;
var ryear = /(?:19[789]\d|20\d\d)/;

// Matches a date in Beeminder format like "31" or "12 31" or "2016 12 31"
var rdate = regexcat(["(?:",                            rday, "|", 
                                           rmon, /\s+/, rday, "|", 
                             ryear, /\s+/, rmon, /\s+/, rday, ")"]);
  
// Matches a real number, including all of these: 1 12 1. 1.1 .1
var rnumb = /(?:\d+\.?\d*|\.\d+)/;  // digits + dot? + digits?  OR  dot + digits

// Matches a real number with an optional plus or minus in front
var rsnumb = regexcat([/[\+\-]?/, rnumb]);

// Matches a British-style weight like "10st9" for 10 stone 9 pounds
var rstone = regexcat([/\d+st/, rnumb, "?"]); // digits + "st" + numb?

// Matches times like "3:02" or "4:03:02" or "0:90" but not "1:90"
var rtime = /(?:\d*\:[0-5]\d(?:\:[0-5]\d)?|0?0?\:\d\d)/;

// Matches a double-quote (including curly ones)
var rquote = /[\"\u201c\u201d]/;

// Matches a comment in Beeminder format. NB: allows quotes in the comment
var rcomment = regexcat([rquote, /.*/, rquote]); 

// Monster regex for matching a valid Beeminder datapoint
var rdata = regexcat([
  /^\s*/,                                      // match group numbers in []'s
  "(", rdate, "|", /\^+/, ")", /\s+/,          // [1] D | M D | Y M D | caret(s)
  "(", rsnumb, "|", rstone, "|", rtime, ")",   // [2] datapoint value
  "(?:", /\s+/, "(", rcomment, "))?",          // [3] comment with quotes
  /\s*$/,
]);

// Return an html string for whether a datapoint is good or bad
function showgb(s) {
  return rdata.test(s) ? '<font color="green">✔</font>' : 
                         '<font color="red">✖</font>';
}

// Helper for insertrow(); takes datapoint and returns array of 5 strings
function parse(d) {
  var marr = d.match(rdata); // match array (0th element is the whole match)
  var date, value, comment;
  if (!marr) { return [showgb(d), d, '', '', ''] }
  if (marr.length !== 4) { return ['??', d, '', '', 'REGEX_MUST_BE_BROKEN'] }
  [date, value, comment] = marr.slice(1);
  if (typeof(comment)==='undefined') { 
    comment = '<font color=#BBBBBB>undefined</font>';
  }
  return [showgb(d), d, date, value, comment];
}

// Takes a datapoint d and inserts a row at position r in the table for it
function insertrow(d, r=1) { // I think default args are an es6 thing
  var row = document.getElementById("dptable").insertRow(r);
  parse(d).map((x,i) => row.insertCell(i).innerHTML = `<pre>${x}</pre>`);
}

// http://stackoverflow.com/questions/13627308/add-st-nd-rd-and-th-ordinal-suffi
function ordinalize(n) {
  var d  = n % 10;  // last digit
  var dd = n % 100; // last 2 digits
  if      (d === 1 && dd !== 11) { return n + "st"; }
  else if (d === 2 && dd !== 12) { return n + "nd"; }
  else if (d === 3 && dd !== 13) { return n + "rd"; }
  else                           { return n + "th"; }
}
/* Overclever version, also from above stackoverflow link:
  s = ["th", "st", "nd", "rd"];
  v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
*/

$(() => {
  var dcur = ''; // current datapoint as typed so far
  var lastpress = -1; // last keypress
  var datapoint

  var date = new Date();
  var day = date.getDate();
  $('#dfield').attr('placeholder', `${day} 123 ` 
    + `"optional comment about reporting 123 on the ${ordinalize(day)}"`);

  // fetch the initial sample datapoints from the server
  $.get('/datapoints', (datapoints) => {
    datapoints.forEach(x => insertrow(x, -1));

    $('#monster') .html(JSON.stringify(rdata.source));
    $('#smonster').html(rdata.source);
  });

  $('form').submit(event => {
    event.preventDefault();
    datapoint = $('input').val();
    $.post('/datapoints?' + $.param({datapoint: datapoint}), () => {
      insertrow(datapoint);
      $('input').val('');
      $('input').focus();
    });
  });
  $('form').keydown(event => {
    if (event.which === 38 && lastpress !== 38) { // up-arrow: show last datapt
      lastpress = 38;
      dcur = $('#dfield').val();
      $('#dfield').val(datapoint);
      return false; // this makes the cursor go to the end for whatever reason
    } else if (event.which === 40) { // dn-arrow: back to what user was typing
      lastpress = 40;
      $('#dfield').val(dcur);
      return false;
    } else { 
      lastpress = event.which;
    }
  });
});

// ---------------------------------- 80chars --------------------------------->

/* 

The original regex in beetils.js:
^\s*((?:(?:\d{1,4})\s+){1,3}|\^+\s+)((?:(?:\+|\-)?(?:\d+\.?\d*|\d*\.?\d+))|(?:\d
+st[\d\.]*)|(?:(\d+)\:(\d\d)(?:\:(\d\d))?))(\s+[\"\u201c\u201d].*?[\"\u201c\u201
d])?\s*$

re = new RegExp("^\\s+$"); // note escaped backslash

*/
