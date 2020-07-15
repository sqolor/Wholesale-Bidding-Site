const redis = require('redis');
var client    = redis.createClient();
client.on('connect',function(){
  console.log('redis client connected');
});
var auctionNum;
var prevClosedAuction;
client.get('auctionNum', function (error, result) {
    if (error) {
        console.log(error);
        throw error;
    }
    auctionNum=parseInt(result,10);
  });
client.get('prevClosedAuction', function (error, result) {
      if (error) {
          console.log(error);
          throw error;
      }
      prevClosedAuction=parseInt(result,10);
    });
function auctionCloser(){
  prevClosedAuction++;
  client.send_command("SCAN", ['auctions',0,"MATCH", "*"+prevClosedAuction+"*"], function(err, reply) {
    
  });
}
