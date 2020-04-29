var http = require('http');
const util = require('util');
var fs = require('fs');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var redis = require('redis');
var redis_json=require('redis-json');
var client    = redis.createClient();
var respone="";
client.on('connect',function(){
  console.log('redis client connected');
})
let auctionNum="auctionNum"
client.set(auctionNum,1);
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
app.post('/addauction',function(req,res,next){
  var id;
  let auctionNum="auctionNum";
  client.get('auctionNum', function (error, result) {
      if (error) {
          console.log(error);
          throw error;
      }
      id=result;
      let hd = req.body.hd;
      let c=req.body.c;
      let t =req.body.t;
      let auctionName =req.body.demo_name;
      let desc = req.body.demo_desc;
      let bid= req.body.demo_bid;
      let user = req.session.username;
      let auctionkey=user+id;
      if(req.body.c){
        auctionkey=auctionkey+"c";
      }
      if(req.body.hd){
        auctionkey=auctionkey+"h";
      }
      if(req.body.t){
        auctionkey=auctionkey+"t";
      }
    console.log(util.inspect(auctionkey, {depth: null}));
    client.hmset(auctionkey,[
        'auctionName',auctionName,
        'desc',desc,
        'bid',bid,
        'username',user
      ],function(err,reply){
        if(err){
          console.log(err);
        }
        console.log(reply);
        client.set("auctionNum",id+1);
        res.redirect('/');
      });
  });

});
app.post('/login',function(req,res,next){
  let username =req.body.demo_name;
  let password = req.body.demo_password;
  client.hgetall(username,function(err,obj){
    if(!obj){
      console.log('User doesnt exist');
      res.redirect('login.html');
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
app.get('/addauction',function(req,res,next){
  if(!req.session.username){
    res.redirect('login.html');
  }
  else{
    res.redirect('addauction.html');
  }
});
app.post('/search',function(req,res,next){
  let query = req.body.query;
  let rsp;
  client.keys("*"+query+"*",function(err,obj){
    if(!obj){
      console.log('Search Empty');
      res.redirect('search.html');
    }
    else{
      let keys=obj;
      //req.session.rsp="{";
      for(var i = 0, len = keys.length; i < len; i++) {
        client.hgetall(keys[i],function(err,result){
          if(!result){
            console.log('Error during search keys');
          }
          else {
            console.log(util.inspect(result, {depth: null}));
          //  req.session.rsp=req.session.rsp+"{";
            foo=util.inspect(result, {depth: null});
            if(!req.session.rsp){
              req.session.rsp=foo;
              respone=foo;
            }
            else {
              req.session.rsp=req.session.rsp + foo;
              respone=respone+foo;
            }
            //req.session.rsp=req.session.rsp+"}";
          }
        });
 }
// req.session.rsp=req.session.rsp+"}";
req.session.save();
    res.redirect('search.html');
    }

});
});
app.post('/searchresult',function(req,res,next) {
  console.log(req.session.rsp);
  console.log(util.inspect(req.session.rsp, {depth: null}));
  r=respone;
  res.json(r);
});
