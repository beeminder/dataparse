const express = require('express')
const app = express()
  
// Test suite: Each element of this list is a test datapoint. Each test 
// datapoint is a list where the 0th element indicates whether the datapoint is 
// valid. The remaining elements making up a test datapoint are concatenated 
// with spaces interspersed to form the urtext. We then make sure that when we 
// parse the urtext that it's validity matches the 0th element and that we get 
// back the original elements when parsing it into date, value, and comment. For 
// example, we have a line like [true, '^', 1] which yields urtext of '^ 1' and 
// since that parses to a date of '^' of and a value of 1 with no comment, that
// means the initial "true" is correct, as are the '^' and 1 elements of the
// test datapoint.
const datasuite = [
  ['^ -0:30 "beedroid accepts negative amounts of times like this..."',
   ['^','-0:30','"beedroid accepts negative amounts of times like this..."']],
  ['1 123 maybe we shouldn\'t ought to need quotes around the comment...', 
   undefined],
  ['^ 1 "yay carets"', 
   ['^', '1', '"yay carets"']],
  ['^^   .2', 
   ['^^', '.2']],
  ['31 3.   ""', 
   ['31', '3.', '""']],
  ['0 4.5', 
   undefined],
  ['-1 6', 
   undefined],
  ['1 -6', 
   ['1',"-6"]],
  ['31 +6', 
   ['31', '+6']],
  ['12 31 0 "you can optionally specify a month"', 
   ['12 31', "0", '"you can optionally specify a month"']],
  ['32 123 "regex can tell "32" is bad month"', 
   undefined],
  ['^ 01:30 "values can be HH:MM:SS format"', 
   ['^', '01:30', '"values can be HH:MM:SS format"']],
  ['^ 01:60 "1st digit of minutes/seconds must be <6"', 
   undefined],
  ['^ :90 "unless the first part is 0; HT Darya"', 
   ['^', ':90', '"unless the first part is 0; HT Darya"']],
  ['^ 01:02:03', 
   ['^', '01:02:03']],
  ['^ 1:2 "minutes and seconds have to be 2 digits"', 
   undefined],
  ['^^ :01', 
   ['^^', ':01']],
  ['^ 10st9 "british people weigh themselves in stones"', 
   ['^', '10st9', '"british people weigh themselves in stones"']],
  ['2016 12 31 00 "or year and month"', 
   ['2016 12 31', '00', '"or year and month"']],
  ['01 01  000.2 "leading zeros are fine"', 
   ['01 01', '000.2', '"leading zeros are fine"']],
  ['1969 12 31 1234 "only years 1970-2099 allowed"', 
   undefined],
  ['99 6 6  123 "need 4-digit years"', 
   undefined],
  ['1 2 3', 
   ['1 2', '3']],
  ['2017 1 19.7 0 "fractional days not allowed"', 
   undefined],
]

// ---------------------------------- 80chars --------------------------------->
// Helper for test() that prints the error message when things don't match
function blargh(n, msg, og, parsed) {
  console.log(
    `\nTest case ${n} mismatch: ${msg}\nReceived: |${parsed}|\nFrom:     ${og}`)
}

function testsuite() {
  const parse = require('./pub/client.js')
  const GREEN = parse.GREEN
  const REDEX = parse.REDEX
  const GRAYU = parse.GRAYU
  let happystr = 'Matching test cases: { '
  let datapoint_n = 0
  for (let datapoint of datasuite) {
    let parsed_val = parse.parse(datapoint[0])
    let correct_val = datapoint[1]
    if (correct_val === undefined) { // should be an error
      if (parsed_val[0].trim() !== REDEX) {
        blargh(datapoint_n, "Should be an error", datapoint[0], parsed_val[0])
      } else {
        happystr += `${datapoint_n} `
      }
    } else { // handle values being left out
      let normed_correct_val = null
      if (correct_val.length===1 || correct_val.length>=4) {
        blargh(datapoint_n, "Wrong length", datapoint[0], parsed_val)
        continue
      } else if (correct_val.length===2) {
        normed_correct_val = correct_val.concat([undefined])
      } else {
        normed_correct_val = correct_val
      }
      for (let i=0; i<5; i++) { // perform comparison
        if (typeof(parsed_val[i])!=='string') {
          blargh(datapoint_n, `Parsed value at place ${i} should be a string`, datapoint[0], parsed_val[i])
        }
      }
      
      let all_match = true
      if (parsed_val[0]!==GREEN) {
        blargh(datapoint_n, "Wrong HTML output", datapoint[0], parsed_val[0])
        all_match = false
      }
      if (parsed_val[1]!==datapoint[0]) {
        blargh(datapoint_n, "Wrong original string", 
               datapoint[0], parsed_val[1])
        all_match = false
      }
      if (parsed_val[2]!==normed_correct_val[0]) {
        blargh(datapoint_n, "Wrong date", datapoint[0], parsed_val[2])
        console.log(`\nTest case ${datapoint_n} incorrect. Wrong date.\nReceived: |${parsed_val[2]}|\nFrom: ${datapoint[0]}\nVs: |${normed_correct_val[0]}|`)
        all_match = false
      }
      if (parsed_val[3]!==normed_correct_val[1]) {
        console.log(`\nTest case ${datapoint_n} incorrect. Wrong value.\nReceived: |${parsed_val[3]}|\nFrom: ${datapoint[0]}\nVs: |${normed_correct_val[1]}|`)
        all_match = false
      }
      if (normed_correct_val[2]===undefined && parsed_val[4]===GRAYU) { } // correct
      else if (parsed_val[4]!==normed_correct_val[2]) {
        console.log(`\nTest case ${datapoint_n} incorrect. Wrong comment.\nReceived: |${parsed_val[4]}|\nFrom: ${datapoint[0]}\n Vs: |${normed_correct_val[2]}|`)
        all_match = false
      }
      if (all_match) {
        happystr += `${datapoint_n} `
      }
    }
    datapoint_n++
  }
  console.log(`${happystr}}`)
}

testsuite() // uncomment when testing!

const datapoints = datasuite.map(x=>x[0])

app.use(express.static('pub'))

app.get("/datapoints", (req, resp) => { resp.send(datapoints) })

app.post("/datapoints", (req, resp) => {
  datasuite.push([req.query.datapoint, null])
  resp.sendStatus(200)
})

const listener = app.listen(process.env.PORT, () => {
  console.log('The d app is running on port ' + listener.address().port)
})
