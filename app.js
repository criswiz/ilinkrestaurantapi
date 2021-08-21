'use strict';

const PORT = process.env.PORT || 3000;

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var routes = require('./routes/index');

var publicDir = __dirname + '/public';

app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-type',
    'Authorization'
  );
  next();
});

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

app.use('/', routes);

app.listen(PORT, () => {
  console.log('My Restaurant Api Running');
});
