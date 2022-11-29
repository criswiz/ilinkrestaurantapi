'use strict';

const PORT = process.env.PORT || 3000;

/*
Import express to handle routes
Import body-parser to handle API inputs
Import routes from index.js file
*/

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var routes = require('./routes/index');

var publicDir = __dirname + '/public';

//Set Headers for API calls
app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-type',
    'Authorization'
  );
  next();
});

//Use JSON formatter

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicDir));

//Error Handler Config
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError')
    res.status(401).send(
      JSON.stringify({
        success: false,
        message: 'Invalid Web Token',
      })
    );
  else next(err);
});

//Run api at base URL
app.use('/', routes);

//Confirm API is running 
app.listen(PORT, () => {
  console.log('My Restaurant Api Running');
});
