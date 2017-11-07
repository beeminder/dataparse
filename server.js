var express = require('express')
var app = express()

// Test suite (should pair with expected parsings)
var datapoints = [
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

app.use(express.static('public'))

app.get("/", (req, resp) => { resp.sendFile(__dirname + '/views/index.html') })
app.get("/datapoints", (req, resp) => { resp.send(datapoints) })

// could also use the POST body instead of query string: 
// http://expressjs.com/en/api.html#req.body
app.post("/datapoints", (req, resp) => {
  datapoints.push(req.query.datapoint)
  resp.sendStatus(200)
})

var listener = app.listen(process.env.PORT, () => {
  console.log('The d app is running on port ' + listener.address().port)
})
