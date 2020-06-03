const http = require('http');
const util = require('util');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const redis = require('redis');
const redis_json=require('redis-json');
var path = require('path');
const webpush=require('web-push');
var formidable = require('formidable');
const multer = require("multer");
const upload = multer({
  dest: "/userimages"
  // you might also want to set some limits: https://github.com/expressjs/multer#limits
});
var client    = redis.createClient();
var respone="";
var searchKeys;
client.on('connect',function(){
  console.log('redis client connected');
})
var publicKey= "BKjvEZrMTvM5e_RF4dTsohQZWzxT-7S6Bfn4JdWbkrvNhkIhdorYfxoFm4xZthhrt1NYHXwE-bYo2AP6_3bKISE";
var privateKey= "5712Xsr-D_X-hzWo1_vhvDpOFlNrYRSwZWYJ0bncaGw";
let auctionNum="auctionNum";
webpush.setVapidDetails('mailto:example@yourdomain.org',publicKey,privateKey);
let currentauction="";
var cflag=false;
var hdflag = false;
var tflag=false;
client.set(auctionNum,1);
var app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
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
      id=parseInt(result,10);
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
        cflag=true;
      }
      if(req.body.hd){
        auctionkey=auctionkey+"h";
        hdflag=true;
      }
      if(req.body.t){
        auctionkey=auctionkey+"t";
        tflag=true;
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
var tempkey;
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
      searchKeys=obj;
      console.log(util.inspect(keys, {depth: null}));
      for(var i = 0, len = keys.length; i < len; i++) {
        tempkey=keys[i];
        client.hgetall(keys[i],function(err,result){
          if(!result){
            console.log('Error during search keys');
          }
          else {
            foo=util.inspect(result, {depth: null});
            if(!foo.includes("bidamount")){
            if(!req.session.rsp){
              req.session.rsp=foo;
              respone=foo;

            }
            else {
              req.session.rsp=req.session.rsp+",";
              respone=respone+",";
              req.session.rsp=req.session.rsp + foo;
              respone=respone+foo;
            }
          }
          }
        });
 }
req.session.save();
    res.redirect('search.html');
    }

});
});
app.post('/searchresult',function(req,res,next) {
  r=respone;
  res.json(r);
});
app.get('/getauction',function(req,res,next){
  auctionName= req.query.auctionname;
  req.session.currentauction = auctionName;
  currentauction = auctionName;
  console.log(currentauction);
  client.hgetall(auctionName,function(err,obj){
    if(!obj){
      console.log('Null Auction');
      res.redirect('index.html');
    }
    else {
      let auctioncookie ={
      auctionName : obj.auctionName,
      desc : obj.desc,
      bid : obj.bid,
      userName : obj.userName
    };
    res.cookie("auctioncookie", auctioncookie);
      res.redirect('/auctionpage.html');
    }
});
});
app.post('/keysresult',function(req,res,next) {
  searchKeys.sort((x,y) => x.length - y.length);
  res.json(searchKeys);
});
app.post('/bidonauction',function(req,res,next) {
  client.keys("*"+currentauction+"*",function(err,obj){
    if(!obj){
      console.log('Error: No Auction Found on bid');
      res.redirect('index.html');
    }
    else {
      if(obj.length==1){
        client.hmset(req.session.currentauction+"bid1",[
          'auctionkey',req.session.currentauction,
          'bidamount',req.body.bidamount,
          'userName',req.session.username
        ],function(err,reply){
          if(err){
            console.log(err);
          }
          console.log(reply);
          res.redirect('/');
        });
      }
      else {
        var temp = obj;
        temp.sort((x,y) => x.length - y.length);
        lastbidindex = obj[obj.length-1];
        lastbidindex = lastbidindex.slice(-1);
        lastbidindex = parseInt(lastbidindex, 10);
        lastbidindex++;
        client.hmset(req.session.currentauction+"bid"+lastbidindex,[
          'auctionkey',req.session.currentauction,
          'bidamount',req.body.bidamount,
          'userName',req.session.username
        ],function(err,reply){
          if(err){
            console.log(err);
          }
          console.log(reply);
          res.redirect('/');
        });
      }
    }
});
});
app.post('/checkhighestbid',function(req,res,next) {
  client.keys("*"+req.session.currentauction+"*",function(err,obj){
    if(!obj){
      console.log('Error: No Bid Found on Auction');
    }
    else {
      var temp = obj;
      temp.sort((x,y) => x.length - y.length);
      i=obj.length;
      client.hgetall(temp[i-1],function(err,result){
        if(err){
          console.log(err);
        }
        else {
          res.json(result);
        }
      });
    }
});
});
app.post('/subscribe',function(req,res,next){
  var title = "No New Auctions";
  if(cflag) title="New Construction Auctions";
  if(hdflag) title="New Home Design Auctions";
  if(tflag) title="New Technology Auctions";
  const subscription = req.body;
  res.status(201).json({});
  const payload = JSON.stringify({title : title});
  console.log("Sending push");
  console.log(subscription);
  webpush.sendNotification(subscription,payload).catch(err=>console.error(err));

});
app.post('/subscribepush',function(req,res,next){
  let hd = req.body.hd;
  let c=req.body.c;
  let t =req.body.t;
  if(hd){
    client.sadd( "homedesign", req.session.username, function(err,res) {
         console.log("subscribed user to homedesign");


      });
  }
  else if (c) {
    client.sadd( "construction", req.session.username, function(err,res) {
         console.log("subscribed user to construction");

      });
  }
  else if (t) {
    client.sadd( "technology", req.session.username, function(err,res) {
         console.log("subscribed user to technology");

      });
      res.redirect('/');
  }
});

const handleError = (err, res) => {
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
    console.log(err);
};


app.post("/uploaduserimage",
  upload.single("files" /* name attribute of <file> element in your form */),
  (req, res) => {
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "./uploads/image"+req.session.username+".png");

    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
      fs.rename(tempPath, targetPath, err => {
        if (err) return handleError(err, res);
        client.hmset(req.session.username,[
          'userphoto', targetPath
        ],function(err,reply){
          if(err){
            console.log(err);
          }
          req.session.userphoto=targetPath;
          console.log(reply);
        });
        res.redirect('/');
      });
    } else {
      fs.unlink(tempPath, err => {
        if (err) return handleError(err, res);

        res
          .status(403)
          .contentType("text/plain")
          .end("Only .png files are allowed!");
      });
    }
  }
);
app.post('/getimage',function(req,res,next){
  client.hgetall(req.session.username,function(err,obj){
    if(!obj){
      console.log('User doesnt exist');
      res.redirect('login.html');
    }
    else{
      req.session.userphoto=obj.userphoto;
      res.json(req.session.userphoto);
    }
  });
});
