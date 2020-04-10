var http = require('http');
var fs = require('fs');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var redis = require('redis');
var client    = redis.createClient();1
client.on('connect',function(){
  console.log('redis client connected');
})
var app = express();
app.use(bodyParser.urlencoded());
var publicDir = require('path').join(__dirname,'');
app.use(express.static(publicDir));
app.listen(8080,  function() {
    console.log('app listening on port 8080!');
});
var cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(session({
    secret: 'ssshhhhh',
    saveUninitialized: false,
    resave: false
}));

app.post('/signup',function(req,res,next){
  let id='1';
  let username =req.body.demo_name;
  let email = req.body.demo_email;
  let usertype= req.body.demo_category;
  let password = req.body.demo_password;
  client.hmset(username,[
    'username',username,
    'email',email,
    'usertype',usertype,
    'password',password
  ],function(err,reply){
    if(err){
      console.log(err);
    }
    console.log(reply);
    res.redirect('/');
  });
});
app.post('/login',function(req,res,next){
  let username =req.body.demo_name;
  let password = req.body.demo_password;
  client.hgetall(username,function(err,obj){
    if(!obj){
      console.log('User doesnt exist');
    }
    else{
      req.session.username=obj.username;
      console.log('User '+req.session.username+' logged in');
      let usercookie ={
      username : req.session.username
    };
    res.cookie("usercookie", usercookie);
      res.redirect('/');
    }
  });
});
app.get('/userpage',function(req,res,next){
  if(!req.session.username){
    res.redirect('login.html');
  }
  else{
    res.redirect('userinfo.html');
  }
});
