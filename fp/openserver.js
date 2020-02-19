var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var publicDir = require('path').join(__dirname,'');
app.use(express.static(publicDir));
app.listen(8080,  function() {
    console.log('app listening on port 8000!');
});
