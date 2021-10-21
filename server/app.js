'use strict';

// LOAD PACKAGES
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var path = require('path')
var fs = require('fs');
var server = require('http').createServer(app);
var urlencodedParser = bodyParser.urlencoded({ extended: false })
const log4js = require('log4js')
var session = require('express-session');

// CONFIGURE APP TO USE ejs

log4js.configure({
    appenders: {
      console: {type: 'console'},
      // file: {type: 'file', filename: 'cheese.log'}
    },
    categories: {
      express: {appenders: ['console'], level: 'info'},
      default: {appenders: ['console'], level: 'info'}
    }
  })
  app.use(log4js.connectLogger(log4js.getLogger('express'), {level: 'auto', format: ':method :url'}))
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
// app.set('views', './views');
 
app.set('view engine', 'ejs');

// CONFIGURE APP TO USE bodyParser
app.use(bodyParser.json());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));

// CONFIGURE SERVER PORT
var port = process.env.PORT ||3000;
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

app.use(session({
  secret: '!@#!$!@#dnct!@#!%!@#',
  resave: false,
  saveUninitialized: true
 }));

// CONFIGURE ROUTER
var routes = require(__dirname+'/router/index.js');

// RUN SERVER
// app.listen(port,function(){
//     console.log('Server listening on port' + port + '...');
// });
  

routes(app);

module.exports = app
