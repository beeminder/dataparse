const express = require('express')
const app = express()

// Test suite
// TODO: Instead of just a list of strings, this should be a list of lists 
// or objects that give the urtext along with how we expect it to be parsed.
let datapoints = [
  '^ -0:30 "beedroid accepts negative amounts of times like this..."',
  '1 123 maybe we shouldn\'t ought to need quotes around the comment...',
  '^ 1 "yay carets"',
  '^^   .2',
  '31 3.   ""',
  '0 4.5',
  '-1 6',
  '1 -6',
  '31 +6',
  '12 31 0 "you can optionally specify a month"',
  '32 123 "regex can tell "32" is bad month"',
  '^ 01:30 "values can be HH:MM:SS format"',
  '^ 01:60 "1st digit of minutes/seconds must be <6"',
  '^ :90 "unless the first part is 0; HT Darya"',
  '^ 01:02:03',
  '^ 1:2 "minutes and seconds have to be 2 digits"',
  '^^ :01',
  '^ 10st9 "british people weigh themselves in stones"',
  '2016 12 31 00 "or year and month"',
  '01 01  000.2 "leading zeros are fine"',
  '1969 12 31 1234 "only years 1970-2099 allowed"',
  '99 6 6  123 "need 4-digit years"',
  '1 2 3',
  '2017 1 19.7 0 "fractional days not allowed"',
]

app.use(express.static('pub'))

app.get("/", (req, resp) => { resp.sendFile(__dirname + '/views/index.html') })
app.get("/datapoints", (req, resp) => { resp.send(datapoints) })

app.post("/datapoints", (req, resp) => {
  datapoints.push(req.query.datapoint)
  resp.sendStatus(200)
})

const listener = app.listen(process.env.PORT, () => {
  console.log('The d app is running on port ' + listener.address().port)
})
