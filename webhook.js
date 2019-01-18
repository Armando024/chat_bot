const express = require('express');
const bodyParser = require('body-parser');
const app = express();
/*getting API keys and page key
*/
require('dotenv').config();
var auth=process.env.APIKEY;
var page_key=process.env.PAGEKEY;
var ai_key=process.env.AIKEY;
var we_key=process.env.WEATHERKEY
var langKey=process.env.LANGKEY;
/* End getting key */
const ai = require('apiai')(ai_key);
/* Setting up language to language code*/
var translate=require('yandex-translate')(langKey);
var mp=new Map([['Chinese','zh'],['Engish','en'],['French','fr'],['German','de'],['Italian','it'],['Japanese','ja'],['Korean','ko'],['Spanish','es'],['Swedish','sv'],['Thai','th'],['Turkish','tr'],['Ukranian','uk'],['Polish','pl'],['Russian','ru'],['Hindi','hi'],['Indonesian','id'],['Danish','da'],['Dutch','nl'],['Norwegian','no']]);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});



/* For facebook Validation */
app.get('/webhook', (req, res) => {
  console.log(req);
  console.log("asking for verification");
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === String(auth) ) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

//app.get('/web'

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  console.log('receving post request');
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});





const request = require('request');
function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;
  let apiai=ai.textRequest(text,{sessionId:'cool_cat'});
  apiai.on('response',(response)=>{
  let aiText=response.result.fulfillment.speech;
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: page_key},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: {text: aiText}
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
  });
  
  apiai.on('error',(error)=>{console.log(erro);});

  apiai.end();
}

function Translate(callback,txt){
    translate.translate(txt,{to:'es'},function(err,res){ 
        console.log(res.text);
        callback(res.txt);
    });

}

function logTxt(txt){
    return txt;
}

app.post('/webhook/ai', (req, res) => {
    var action=String(req.body.queryResult.action); 
    console.log(req.body);
    if (action === 'weather') {
        let city = req.body.queryResult.parameters['geo-city'];
        let zipcode=req.body.queryResult.parameters['zip-code'];
        let lang=req.body.queryResult.parameters['language'];
        /*ZipCode is more accurate than a city therefore if both are given i search in zipcode */
        let restUrl;
        if(zipcode!=''){
        restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+we_key+'&zip='+zipcode+',us'+'&units=imperial';
        }else{
        restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+we_key+'&q='+city+'&units=imperial';
        }

        request.get(restUrl, (err, response, body) => {
        if (!err && response.statusCode == 200) {
            let json = JSON.parse(body);
            let msg = json.weather[0].description + ' and the temperature is ' + json.main.temp + ' ℉';
            //console.log(mp.get(lang));
            if(lang!=''){
                let langCode=mp.get(lang);
                if(langCode===undefined){
                    msg+=' Sorry we could not translate.Please try again';
                    return res.json({
                        fulfillmentText:msg
                        ,source:'weather'
                    });
                }
                translate.translate(msg,{to:langCode},function(err,results){
                    return res.json({
                        fulfillmentText:results.text
                        ,source:'weather'});
                });
            
            }else {
                return res.json({
                    fulfillmentText: msg,
                    source: 'weather'});}
        
        } else {
           return res.status(400).json({
            status: {
            code: 400,
            errorType: 'I failed to look up the city name.'}});
         }
        })
      } });


/*Chinese zh
 *English
 *French
 *German
 *Italian 
 *Japanese
 *Korean
 *Portuguese
 *Spanish
 *Swedish
  Thai
  Turkish
  Ukranian
  Polish
  Russian
  Hindi
  Indonesian
  Danish
  Dutch
  Norwegian



 */







