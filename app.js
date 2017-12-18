var DEVELOPMENT = true;
var PRODUCTION =false;
var colors = require('colors');

var logger = require('tracer').colorConsole({
  format: "{{timestamp.white}} <{{title.yellow}}> {{message.cyan}} (in {{file.red}}:{{line}})",
  dateformat: "HH:MM:ss.L"
})

var express = require('express');
var socketio = require('socket.io')
var Jimp = require("jimp");
var compression = require('compression')
var cors = require('cors')


var https = require('https');
var http = require('http');
var httpRD = require('http');
var favicon = require('serve-favicon');
var app = express();
var serverRD = httpRD.Server(app);
var WebSocket = require('ws').Server


var fs = require("fs");

if (DEVELOPMENT===true) {
var server = http.createServer(app);
var io = socketio(server);
var wss = new WebSocket({ server: server })
}

if(PRODUCTION===true){
//PRODUCTION USE
var sslOptions = {
  key: fs.readFileSync('../../../../../../../../../../etc/letsencrypt/live/meetapp.us/privkey.pem'),
  cert: fs.readFileSync('../../../../../etc/letsencrypt/live/meetapp.us/fullchain.pem')
};

var httpsServer = https.createServer(sslOptions, app);
var io = socketio(httpsServer);
var wss = new WebSocket({ server: httpsServer })
}
ss = require('socket.io-stream')(io);
var OS = require('os')
var formidable = require('formidable');
var path = require('path');
var request = require("request");
var cheerio = require("cheerio");
var bodyParser = require('body-parser');
var passwordHash = require('password-hash')
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/users';
var HTTP_PORT  = 80;
var HTTPS_PORT = 443;
var loggedin;
var startGame;





app.use(cors())

app.use(compression())

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
var userLoggedIn;
app.enable('trust proxy');
app.set('username', 'null')
app.set('userLoggedIn', false)
app.set('clientDir', __dirname+'/client/')


if (PRODUCTION===true) {
 app.all('/*', function(req, res, next) {   
  if (/^http$/.test(req.protocol)) {
     var host = req.headers.host.replace(/:[0-9]+$/g, ""); // strip the port # if any
     if ((HTTPS_PORT != null) && HTTPS_PORT !== 443) {
       return res.redirect(301, "https://" + host + ":" + HTTPS_PORT + req.url);
     } else {
       return res.redirect(301, "https://" + host + req.url);
     }
   } else {
     return next();
   }
 });
 };

app.use(express.static('client'));
app.use(favicon(__dirname + '/client/images/favicon.ico'));

app.get('/', function(req, res){
  logger.log('connection IP address '+req.ip);
  var readStream = fs.createReadStream(app.get('clientDir')+'index/index.html');
     //res.set({"Content-Disposition":"attachment; filename=//mygrid/myGridDocs.html"});
     readStream.pipe(res);
  // res.send(req.ip)
})

app.get('teamBallJS/', function(req, res){
  logger.log('Duble dribble Teabball event '+req.connection.remoteAddress);
})

app.post('/goright', function(req, res){
  logger.log('were going right SERVO')
  http.get({
    hostname:"192.168.200.88",
    port:8266,
    path:'/g'
  }, function(resp){
    logger.log('resp '+resp)
    res.send()
  })
})

app.post('/goleft', function(req, res){
  logger.log('were going left SERVO')
  http.get({
    hostname:"192.168.200.88",
    port:8266,
    path:'/l'
  }, function(resp){
    logger.log('resp '+resp)
    res.send('done')
  })
})




app.get('users/:username/', function(req, res){
  var username = req.params.username;
      var readStream = fs.createReadStream(app.get('clientDir')+'users/'+username+'/index.html');
  
        if(!readStream){
          logger.log(err+' no index.html in this users DIRRRRR')
        }else{
            readStream.pipe(res);            
          }
    

})

function resizeThisImage(image){
  logger.log('Lets resize this image '+image);
  Jimp.read(image, function (err, lenna) {
    if (err) {
      logger.log( err)
    
    }else{
          lenna.resize(256, 256)            // resize 
         .quality(60)                 // set JPEG quality 
         .greyscale()                 // set greyscale 
         .write(image+"-small-bw.jpg"); // save 
       }
});
}

app.get('/video', function(req, res){
    var readStream = fs.createReadStream(app.get('clientDir')+'webcamstream.html');
     // res.set({"Content-Disposition":"attachment; filename=//scrape/iframe.html"});
     readStream.pipe(res);
})

var STREAM_PORT = 9998
// HTTP Server to accept incomming MPEG Stream
var streamServer = require('http').createServer( function(request, response) {
  var params = request.url.substr(1).split('/');

  if( params[0] == 'badass' ) {
    response.connection.setTimeout(0);
    
    width = (params[1] || 320)|0;
    height = (params[2] || 240)|0;
    
    logger.log(
      'Stream Connected: ' + request.socket.remoteAddress + 
      ':' + request.socket.remotePort + ' size: ' + width + 'x' + height
    );
    request.on('data', function(data){
      // logger.log('data')
      wss.broadcast(data, {binary:true});

    });
  }
  else {
   logger.log(
     'Failed Stream Connection: '+ request.socket.remoteAddress + 
     request.socket.remotePort + ' - wrong secret.'
   );
   response.end();
  }
}).listen(STREAM_PORT);


// app.get('/badass', function(req, res){
//   logger.log(req)
//   req.on('data', function(data){
//     logger.log('data emit steam server??')
//     // socketServer.emit(data, {binary:true});
//   });


// })

app.post('/uploads', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  if (app.get('username')=== null) {logger.log('were going to get an error')};
  logger.log(app.get('username')+ ' Username folder gogogog')
  if(!path.join(app.get('clientDir')+'users/'+app.get('username'))){
    logger.log('THIS IS EXACTLY WHERE THE ERROR OCCURS< MAKR DIRRRR')
  }
  form.uploadDir = path.join(app.get('clientDir')+'users/'+app.get('username'));

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    logger.log('field-'+field+' : file-'+JSON.stringify(file));
    var ext = file.name
    var index = ext.lastIndexOf('.')
    var ext = ext.slice(index)

    fs.rename(file.path, file.path+ext);
    resizeThisImage(file.path+ext)
  });

  // log any errors that occur
  form.on('error', function(err) {
    logger.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);

});

app.post('/updateLocations', function(req, res){
  MongoClient.connect(url, function(err, db) {
    if (!err) {
  var ReqBody = req.body;
  var Length = ReqBody.length;
  var tempTimeArry = []
  var tempLatArry = []
  var tempLngArry = []
  for (var x = 0; x< Length; x++){
    logger.log(ReqBody[x]);
    tempLngArry.push(ReqBody[x].lng)
    tempLatArry.push(ReqBody[x].lat)
    tempTimeArry.push(ReqBody[x].timestamp)

  
        var collection = db.collection('allusers');

    }
    collection.update({'username': ReqBody[0].username}, {$push:{'locations.lat': {$each: tempLatArry}}}, function(err, r){
      if(err){logger.log('error updateing users location '+err)}
        else{'Ok no error updating user locations Array ' +r}
    })
    collection.update({'username': ReqBody[0].username}, {$push:{'locations.lng': {$each: tempLngArry}}}, function(err, r){
      if(err){logger.log('error updateing users location '+err)}
        else{'Ok no error updating user locations Array ' +r}
    })
    collection.update({'username': ReqBody[0].username}, {$push:{'locations.time': {$each: tempTimeArry}}}, function(err, r){
      if(err){logger.log('error updateing users location '+err)}
        else{'Ok no error updating user locations Array ' +r}
    })

  }else{
    logger.log('Sorry there was an error accessing the DB '+err)
  }})

  res.end('you did it!!')
})



  var width = 320,
    height = 240,
     STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

wss.on('connection', function(socket){
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  var streamHeader = new Buffer(8);
  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, {binary:true});

  logger.log( 'New WebSocket Connection ('+wss.clients.length+' total)' );
  
  socket.on('close', function(code, message){
    logger.log( 'Disconnected WebSocket ('+wss.clients.length+' total)' );
  });

})

wss.broadcast = function(data, opts) {
  for( var i in this.clients ) {
    if (this.clients[i].readyState == 1) {
      this.clients[i].send(data, opts);
    }
    else {
      logger.log( 'Error: Client ('+i+') not connected.' );
    }
  }
};




var socketArray = []

io.on('connection', function (socket) {
	logger.log('connection?? ')
  socketArray.push(socket)
  logger.log('socketArray = '+socketArray.length+' added id = '+socket.id)

  //CONECTION
	fs.readFile(__dirname + "/client/views/login.html", 'utf8', function(err, data) {
	    if (err) {
	        logger.log(err)
	    } else {
	        logger.log('data sent in HTML for login.html')
	        socket.emit('connection', socket.id, data)
	    }
	})//CONECTION





    var mkdirp = require('mkdirp');
    socket.on('scrape', function(url){
      var twilli_path = '/home/sailor/templates/login_pages/register_login/'
      var certFile = '/home/sailor/meetapp/meetupBackup/ssl/ca-crt.pem'
      var keyFile = '/home/sailor/meetapp/meetupBackup/ssl/ca-key.pem'
      var index_file_name = 'index.html'
      var options = {
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19'
        },
         agentOptions: {
             cert: fs.readFileSync(certFile),
             key: fs.readFileSync(keyFile),
             // Or use `pfx` property replacing `cert` and `key` when using private key, certificate and CA certs in PFX or PKCS12 format:
             // pfx: fs.readFileSync(pfxFilePath),
             passphrase: 'password',
             securityOptions: 'SSL_OP_NO_SSLv3'
         }
      };
      var root_url = url.split('/').slice(0,-1).join('/')+'/'
          logger.log(url)
          request(options, function(error, response, body) {
              if (!error && response.statusCode === 200) {
                  if (body) {
                       //res.send(body)
                      var chee = cheerio.load(body)
                      //logger.log(chee)
                      logger.log('---------------------------------')
                      var links = chee('link')
                      var imgs = chee('img')
                      var other_imgs = chee('data-img-src')
                      var all_tags = chee('*')
                      var scripts = chee('script')
                      function get_resources(tags, attr){
                        for(var x = 0 ; x < tags.length ; x++){
                          let href = chee(tags[x]).attr(attr)
                          //determin if its an image for the binary method
                          var ext;
                          if(href){
                            if (href.startsWith('http')){continue}
                            ext = href.split('.').slice(-1).join().toLowerCase()
                            logger.log(href)

                            logger.log(ext)
                            logger.log(ext)
                            logger.log(ext)
                            logger.log(ext)
                            logger.log(ext)
                            logger.log(ext)
                            logger.log(href)

                            if(ext === 'png' || ext === 'jpg' || ext === 'gif'){
                              options.encoding='binary'
                              options.url = root_url+href
                              request(options, function(error, response, body) {
                                if (!error && response.statusCode === 200) {
                                  logger.log('no error and response is 200')
                                  if (body) { 
                                    logger.log('body we got')
                                    write_file(body, href, 'binary')

                                  }
                                }else{
                                 logger.log('WTF BINARY??')
                                 logger.log(options.url)
                                 logger.log(error)
                                 // logger.log(response)
                                }
                              });
                            }else{
                              options.encoding=undefined
                              options.url = root_url+href
                              request(options, function(error, response, body) {
                                if (!error && response.statusCode === 200) {
                                  logger.log('no error and response is 200')
                                  if (body) { 
                                    logger.log('body we got')
                                    write_file(body, href)

                                  }
                                }else{
                                  logger.log('WTF text??')
                                  logger.log(options.url)
                                  logger.log(error)
                                  // logger.log(response)
                                  // logger.log(body)
                                }
                              })
                            }

                          }





                        }

                      }

                      function write_file(body, href, binary){
                        if(binary){
                          logger.log('BINARY IMAGE I ASSUME')
                          fs.writeFile(twilli_path+href, body, 'binary', function(err) {
                            huh(err, body, href)
                          })
                        }else{
                          fs.writeFile(twilli_path+href, body, function(err) {
                            logger.log('CSS?? or JS?')

                            huh(err, body, href)


                          })
                        }

                      }


                      get_resources(imgs, 'src')
                      get_resources(links, 'href')
                      get_resources(all_tags, 'data-custom-background-img')
                      get_resources(scripts, 'src')

                      function huh(err, body, href){
                        if(err){
                          logger.log(err)
                          if(err.errno === -2){
                            logger.log('we need to create this DIRRR')
                            let dir_path = href.split('/')
                            logger.log(dir_path)
                            // dir_path.shift()
                            logger.log(dir_path)
                            dir_path = dir_path.slice(0,-1)
                            logger.log(dir_path)
                            dir_path=dir_path.join('/')
                            logger.log(dir_path)
                            mkdirp(twilli_path+dir_path, (err)=>{
                              if(err){logger.log('+++    we cannot make the DIRRRRR   ++++')}
                                else{
                                  logger.log('dir made, lets re write the filessssss')
                                  write_file(body, href)
                                }
                            })
                          }
                        }
                        else{
                          logger.log('files saved @ '+twilli_path+href)
                        }
                      }


                      write_file(body, index_file_name)




                  } else {
                      logger.log('no body')
                      socket.emit('serverResponse', 'no body')
                  }
              }else if(error){
                socket.emit('serverResponse', 'error '+error)
                logger.log('error '+error)
                  for (var k in error){
                logger.log(k+' : '+error[k])
      }
              }else if (response){
                socket.emit('serverResponse', 'response '+response)
                logger.log('response '+response)
                for (var k in response){
                  logger.log(k+' : '+response[k])
      }
              }
          })




    })//scrape

socket.on('new', function(d, loggedInUserSocketid) {
	logger.log('----------new-------------emited')
    var d = JSON.parse(d)
    logger.log((d))
    var formData = (d)
    var username = d.username;
    var password = d.password
        //for(var k in d) logger.log(k+"  :  "+d[k]+" Req.body from the form submit")
    if (username === '' || password === '') {
        socket.emit('loginError', "Please user your keyboard and type in your login info")

    } else {
        MongoClient.connect(url, function(err, db) {
            if (!err) {
            	app.set('username', username)
                var collection = db.collection('allusers');
                logger.log("We are connected to " + db.databaseName + ", poolSize = ");
                logger.log("username " + username + " : Password " + password)
                logger.log('collection name ' + collection.s.name)
                collection.find({
                    'username': username
                }).toArray(function(err, r) {
                    if (err) {
                        logger.log("collection.find error ")
                    } else if (r.length !== 0) {
                    	var userInfo = JSON.stringify(r[0])
                        logger.log('this is the rsult from finding the user ' + JSON.stringify(r[0]))
                        logger.log(r[0]['username'])
                        logger.log(r[0].password)
                        var sock = r[0].socketId
                        logger.log(sock+' The result from Mongo')
                        logger.log(loggedInUserSocketid+' result passed form the new emit ');;
                        sock = sock.split('').splice(-5).join('')

                        if (r[0].password === password) {

                          fs.stat(app.get('clientDir')+'users/'+username, function(err, stat){
                            if (err) {
                              logger.log(err+' error accessing '+username+'`s Directory. So lets create it')
                              fs.mkdir(app.get('clientDir')+'users/'+username, function(err){if(err)logger.log(err+' error creating the users directory')})
                            }
                              else{logger.log('THIS USER IS READY TO UPLOAD FILES!!!');};
                          })

                         
                            logger.log('Lets login this returning user ' + r[0].username)
                            fs.readFile(__dirname + "/client/views/dashBoard.html", 'utf8', function(err, data) {
                                if (err) {
                                    logger.log(err)
                                } else {
                                  
                                    socket.emit('newUserRegister', userInfo,data)
                                    collection.update(
                                      {'username':username},
                                      {$set:
                                        {
                                          'loginDate': new Date(),
                                          'loggedIn': true,
                                          'socketId': socket.id
                                        }}, function(err, r){
                                          if(err){
                                            logger.log('error! updating users logging in '+err)
                                          }else{
                                            logger.log('update and set the user login info : returned '+r)
                                          }
                                        })
                                    socket.broadcast.emit('userLogin', sock, socket.id )
                                      logger.log('sock is the old, socket.id is new')

                                     
                                
                                  }
                          })

                        } else {
                            logger.log('Username and Password do not match')
                            socket.emit('loginError', 'Username and Password do not match')
                        }

                    } else {
                        logger.log('no  results,  : ' + (r.length))
                        logger.log("r does not exist, must be a new user" + r)
                        var insertData = {
                            'username': username,
                            'password': password,
                            'registrationDate': new Date(),
                            'loggedIn': true,
                            'socketId': socket.id,
                            'locations':{
                              'lat':[],
                              'lng':[],
                              'time':[]
                            }

                        }
                        fs.mkdir(app.get('clientDir')+'users/'+username, function(err){
                        										logger.log(err)
                        										fs.readdir(app.get('clientDir')+'users/'+username, function(err, stats){
                        											if (err) {logger.log(err)}
                        												else{logger.log("stats go here "+stats)}
                        										})
                        									})//mkDir new user
                        fs.readFile(__dirname + "/client/views/dashBoard.html", 'utf8', function(err, data) {
                            if (err) {
                                logger.log(err)
                            } else {
                                // logger.log('data sent in HTML for file uploading')
                                collection.insert(insertData)
                                socket.emit('newUserRegister', insertData, data)
                                socket.broadcast.emit('userLogin', sock, socket.id, username )

                            }
                        })//reafFile dashboard.html and send it to new user

                    }//no find.r- create user
                })//mongo.find().toArray()r
            } else {
                socket.emit('loginError', 'failed to connect to the DB')
            }//db connect error or not
        });//mongo client connect
    }//username and pasword are not blank strings
})//socket emit 'new'





socket.on('dashboardReady', function(d){
  logger.log("DASHBOARD IS READY "+d)
  //send the chat data and users online
  MongoClient.connect(url, function(err, db){
    if(err){logger.log('error connection to DB '+err)}
      else{
        var messageArray = []
        var allMessages = db.collection('allmessages');
        var allusers = db.collection('allusers');

        allMessages.find().count(function(err, count){
          if(!err && count>20){
              allMessages.find().skip(count-20).toArray(function(err, item){
                if(err){logger.log('error finding messages '+err)}
                else{
                  for(var k in item){
                    messageArray.push(item[k])
               // logger.log('This is the interation of k in items '+k+' : '+item[k])
                   }
                if(messageArray.length===item.length){
                socket.emit('masterChat', messageArray)
                logger.log('SEND THE MASTER MESSAGE!!!!!!')
              }
            }
        })//allmessages find limit 20




  }else{
    allMessages.find().toArray(function(err, item){
          if(err){logger.log('error finding messages '+err)}
          else{
            for(var k in item){
              messageArray.push(item[k])
         // logger.log('This is the interation of k in items '+k+' : '+item[k])
             }
          if(messageArray.length===item.length){
          socket.emit('masterChat', messageArray)
          logger.log('SEND THE MASTER MESSAGE!!!!!!')
        }
      }
    })
  }
})//allMessages.find()



        var userArray = [];
        allusers.find({}).toArray(function(err, item){
          if(err){logger.log('error finding users '+err)}
            else{
              logger.log(item[item.length])
              for(var x = 0; x< item.length;x++)
                {userArray.push(item[x])}
              if(userArray.length == item.length){
                logger.log('users Array is full')
                socket.emit('usersListData', userArray)
              }

            }
        })
      }//mongo db was successful

  })//mongo.Connect
	logger.log('got an admin  connection with the ID '+d)
	logger.log('admin connected event + username: '+app.get('username'))
	socket.emit('loginInfo', { 
                username:app.get('username'),
								socketid : d,
								totalMemory: OS.totalmem,
								freeMemory: OS.freemem(),
								HomeDir : OS.homedir(),
								HostName: OS.hostname(),
								NetWork : OS.networkInterfaces(),
								Platform: OS.platform(),
								OS_type: OS.type(),
								uptime: OS.uptime(),
								//userInfo: OS.userInfo({'encoding':'utf8'}),
								path : app.get('clientDir')+app.get('username'),
								link : 	'<a class="btn btn-info" href="/users/'+app.get("username")+'">Your link</a>'
								// '<a href="localhost:8081/"'+app.get('username')+'></a>'
								// <a href="">link</a>
	 })//emit login info
	
})//Emit DashboardReady



socket.on('showMeTheFiles', function(username){
  // fs.watch(__dirname+'/client/users/'+username, function(end, filename){
  //   logger.log(filename+' changed in '+__dirname+'/client/users/'+username);
  //   // this.close()
  // })

  logger.log(username+' wants to see thier files');
  fs.readFile(__dirname + "/client/views/dashboard/myFiles.html", 'utf8', function(err, data) {
      if (err) {
          logger.log(err)
      } else {
          logger.log('File list sent in HTML for dashBoard/myFiles.html')
          socket.emit('hereMyFilesHTML',data)

      }
  })
})


socket.on('getUserFiles', function(username){
  logger.log(username+' getUserFiles was emited, lets access that folder');
  fs.readdir(__dirname+'/client/users/'+username, function(err, files){
    if(err){
      if(err.code = "ENOENT"){
        fs.mkdir(app.get('clientDir')+'users/'+username, function(err){if(err)logger.log(err+' error creating the users directory')})
        logger.log('This needs to be fixed')
      }
      logger.log('error: '+err.code+'; while accessing the folder '+__dirname+'/client/users/'+username+' for '+username);
    }else{
      logger.log(files)
      // var dir = __dirname+'/client/users/'+username
      socket.emit('hereListMyFileArray', files, username)
    }

  })



})
var primitiveStateChecker = true;
var primitiveQueueArray = [];

socket.on('LetsRunThatPrimitiveProgram', function(fileName, username){
  runPrimitiveInChildProcess(fileName, username)
})

function runPrimitiveInChildProcess(fileName, username){
 logger.log('primitive was clicked, whats the state??');
        
     if (primitiveStateChecker === true) {
      logger.log('State is true, lets primify this pic');
           var exec = require('child_process').exec
     // var spawn = require('child_process').spawn;
     var grep = exec('grep', ['ssh']);
     logger.log(primitiveStateChecker +' '+grep.pid);
           primitiveStateChecker = false
        logger.log('Primitive photo action was emited for the file '+__dirname+'/client/users/'+username+'/'+fileName);
     // counterHere = false
        //var PRIMITIVE = 
       var primExec = exec('primitive -i '+__dirname+'/client/users/'+username+'/'+fileName+' -o '+__dirname+'/client/users/'+username+'/P-'+fileName+' -n 50 -v')
       primExec.stdout.on('data', function(stdout){
  
                 var perc = stdout.split(' ')
                 if(perc[0].split('').length > 8){
                  perc = perc[1]
                 }else{
                  perc = perc[0]

                 }
                 perc = perc.split('')
                 perc.pop()
                 perc = perc.join('')
                 logger.log(perc/50*100+'%');
                 socket.emit('primitivePercentDone', Math.round(perc/50*100))
                 // logger.log('Precentage: '++'%');
                 
               })
       primExec.on('exit', function(code){
        socket.emit('PrimitivePhotoIsDone',  __dirname+'/client/users/'+username+'/P-'+fileName)
                 primitiveStateChecker = true
                 if(primitiveQueueArray.length > 0){
                   var nextInLine = primitiveQueueArray.shift()
                   runPrimitiveInChildProcess(nextInLine['file'], nextInLine['user'])
                 }
        logger.log('exit with code '+code);
       })
             //})//exec callback
             }else{
              logger.log('THE STATE IS FALSE, we do nothing, sorry caps');
              primitiveQueueArray.push({file: fileName, user:username})
              logger.log(primitiveQueueArray);
             }
}//runPrimitiveChildProcess


socket.on('letsRenameThisFile', function(before, after, username){
  logger.log('Filename: '+before+' changed to '+after+' username '+username);
  var point = before.lastIndexOf('.')
var fileEXT = before.slice(point).toLowerCase()
fs.rename(app.get('clientDir')+'users/'+username+'/'+before, app.get('clientDir')+'users/'+username+'/'+after+fileEXT, function(err){
  if(err){
    logger.log(err);
  }else{
    logger.log('file was renamed '+app.get('clientDir')+'users/'+username+'/'+after+fileEXT);
  }
} )

})


socket.on('UserWantsToDeleteFile', function(filename, username){
  // logger.log('File: '+filename+' and username is:  '+username);
  var someKindOfValidation = true
  if(someKindOfValidation){
    logger.log('Going to Delete file: '+filename+' from folder '+app.get('clientDir')+'users/'+username);
    fs.unlink(app.get('clientDir')+'users/'+username+'/'+filename, function(err) {
   if (err) {
      return console.error(err);
   }
   logger.log("File deleted successfully!");
});
  }
})




socket.on('getMap', function(){
	logger.log('WE NEED TO GET THE MAP FORM THE FILE YO!');
	fs.readFile(__dirname + "/client/views/dashboard/map.html", 'utf8', function(err, data) {
	    if (err) {
	        logger.log(err)
	    } else {
	        logger.log('data sent in HTML for dashBoard/map.html')
	        socket.emit('hereMapHTML',data)
	    }
	})
})

socket.on('GetBlocksHTML', function(){
  logger.log('WE NEED TO GET THE BLOCKS HTML!');
  fs.readFile(__dirname + "/client/views/blocks/blocks.html", 'utf8', function(err, data) {
      if (err) {
          logger.log(err)
      } else {
          logger.log('data sent in HTML for blocks/blocks.html')
          socket.emit('hereBlocksHTML',data)
      }
  })
})

socket.on('blockClick', function(data){
  logger.log(data.id+" : "+data.top+" top "+data.left+" left")
  io.sockets.emit('blockMove', data)
})


socket.on('weGotSomePositionToShare', function(data){
  logger.log(data)

  socket.broadcast.emit('allFriendsGPSPosition', data)
})

socket.on('someUSerStoppedGPSTracking', function(data){
  logger.log(data)
})

socket.on('chatInput', function(d){
  logger.log('got some chat input here from '+d.sender)
  logger.log(d)
  logger.log("my d.time is "+d.time)
  var newTime = new Date(d.time)
  var day = newTime.getDate()
  var month = newTime.getMonth()+1
  var hours = function(){
    if(newTime.getHours()>12){
      return newTime.getHours()-12
    }else{
      return newTime.getHours()
    }
  }
  var AmPm = function(){
    if (newTime.getHours() > 11){
      return 'PM'
    }else{
      return 'AM'
    }
  }
  var minutes = newTime.getMinutes()
  var seconds = newTime.getSeconds()
  var year = newTime.getYear()-100
  logger.log('the date is '+month+"/"+day+"/"+year+" @ "+hours()+":"+seconds+" "+AmPm())
  var timeStamp = month+"/"+day+"/"+year+" @ "+hours()+":"+seconds+" "+AmPm()
  MongoClient.connect(url, function(err, db) {
      if (!err) {
          var collection = db.collection('allmessages');
          logger.log('were in the mongoDB!')
          collection.insert(d, function(err, result){
            if(err){
              logger.log('Error message! '+err)
            }else{
              logger.log('message was inserted to the DB '+result)
              io.emit('chatEvent', d)
              for(var k in result){
                logger.log(k+'  :  '+result[k])
              }
            }
          })
        }else{
          logger.log('Error connecting to Mongo '+err)
        }
  })
})







socket.once('disconnect', function(){
  var indexOfDisconectedSocket = socketArray.indexOf(socket)
  if(indexOfDisconectedSocket >-1){
    logger.log('remove this socket '+socket.id+' from socketArray')
    socketArray.splice(indexOfDisconectedSocket,1)
  }else{
    logger.log('this socket is lost...? '+socket.id)
  }
  logger.log('disconnection! '+socket.id)
  io.sockets.emit('userDisconnected', socket.id)
  MongoClient.connect(url, function(err, db){
    if(err){logger.log(err+' while diconnecting')}
      else{
        db.collection('allusers').update({
          'socketId':socket.id}, {$set: { loggedIn: false,
                                        logoutDate : new Date() }
                                      }, function(e, r){
                                        if(e){logger.log(e)}
                                          else{logger.log('user loged out and DM was updated')}
                    
                                      })
      }

  })
})

socket.on('error', function(err){
  logger.log('We have an error somehwere '+err);
})


})//MASTER IO SOCKET



app.get('/downloadhtmlfile',function(req,res){
	var readStream = fs.createReadStream(app.get('clientDir')+'scrape/iframe.html');
   res.set({"Content-Disposition":"attachment; filename=//scrape/iframe.html"});
   readStream.pipe(res);
});




if (DEVELOPMENT===true) {
//FOR DEV USE
var port = 8080
server.listen( port, function () {

logger.log('lisenign on port '+port+' Development')
//  // for (var k in process){logger.log(k +"  :  "+process[k])}
})
};

if (PRODUCTION===true) {
  serverRD.listen(HTTP_PORT)
// var port = 443



//FOR PRODUCTION
httpsServer.listen( HTTPS_PORT, function () {

logger.log('lisenign on port '+HTTP_PORT+' and on Redirrect port '+HTTPS_PORT)
 // for (var k in process){logger.log(k +"  :  "+process[k])}
})

};



