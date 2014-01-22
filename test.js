var httpInstance = require('http');
var express = require('express');
var fs  = require('fs');
var requestor = require('requestify');
var jsdom = require('jsdom');
var swig = require('swig');

var app = express();
app.listen(8888);


// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });

var configFile = fs.readFileSync('./config.json'),
    myConfObj,
    headerStr,
    headerObj;

console.log(configFile)

try{
  myConfObj = JSON.parse(configFile);
  //console.dir(myConfObj);
  var hotelRateValues = myConfObj.hotelRatesRequest;
  headerStr = "{"+ "\"Host\":\"" + hotelRateValues.header_Host
              + "\",\"Accept-Language\":\"" + hotelRateValues.header_AcceptLanguage
              + "\",\"User-Agent\":\"" + hotelRateValues.header_UserAgent
              + "\",\"Accept\":\"" + hotelRateValues.header_Accept
              + "\",\"Referer\":\"" + hotelRateValues.header_Referer
              + "\",\"Connection\":\"" + hotelRateValues.header_Connection
           + "\"}";

  //console.log(headerStr);
  headerObj = JSON.parse(headerStr);
}
catch (err){
   console.log("There was an error parsing the file."); 
}

app.get('/', function(request,response){
   response.send("The main home page!") 
});

app.get('/search', function(request,response){
  var hotelResponse;
  var resultObjList = new Array();
  
  //response.send('testing this out: '+ myConfObj.hotelRatesRequest.header_Host);
  requestor.request(myConfObj.hotelRatesRequest.url, {
    method: 'GET',
    headers: headerObj        
  })
  .then(function(response2) {
    // get the response body
    response2.getBody();
    //console.dir(hotelResponse);
    // get the response headers
    console.log(JSON.stringify(response2.getHeaders()));

    // get specific response header
    response2.getHeader('Accept');

    // get the code
    response2.getCode();

    // Get the response raw body
    hotelResponse = response2.body;
    
  //console.log("about to send: "+hotelResponse);
    jsdom.env({
      html:hotelResponse,
      scripts: ["http://code.jquery.com/jquery.js"],
      done:function (errors, window) {
        window.$("div.resultListGroup").each(function(index,element){
          //console.log("contents of a.navItemLink:", window.$("a.navItemLink").text());
          //console.log(window.$(this).find("span.rmTypeRoomname").text());
          var roomStr = window.$(this).find("span.rmTypeRoomname").text();
          window.$(this).find("div.resultListItem div.result").each(function(){
            var rateEntryStr = "{";
          
            //console.log(window.$(this).find("li.roomTotal a.terms").text().replace(/\s/g, '')); 
            //console.log(window.$(this).find("li.roomTotal a").attr("href")); 
            //console.log(window.$(this).find("div.rateName a").text()); 
            rateEntryStr = rateEntryStr.concat("\"room\":\"",roomStr,"\",\"rate\":\"",window.$(this).find("li.roomTotal a.terms").text().replace(/\s/g, ''),"\",\"type\":\""+window.$(this).find("div.rateName a").text()) 
            rateEntryStr = rateEntryStr.concat("\",\"url\":\"",escape(window.$(this).find("li.roomTotal a").attr("href")));
            rateEntryStr = rateEntryStr.concat("\"}");  
            response.send(rateEntryStr);
            var resultObj = JSON.parse(rateEntryStr);
            resultObjList.push(resultObj);
            //console.log(resultObjList.toString());
          });
        });
        
        //console.log(window);
        window.close();
    }}
  );
    
    //response.send(hotelResponse);
  
  
  });
 
});

app.post('/getrates', function(request, response){
//  request.
  
});


//console.log("test");