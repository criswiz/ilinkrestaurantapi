'use strict';

const PORT = process.env.PORT || 3000;

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var routes = require('./routes/index');

var publicDir = __dirname + '/public';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicDir));

app.use('/', routes);

app.listen(PORT, () => {
  console.log('My Restaurant Api Running');
});
