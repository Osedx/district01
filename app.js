"use strict";

process.env.NODE_ENV = process.env.NODE_ENV || "local";

require("rootpath")();
var express = require("express");
var app = express();
var http = require("http");
var server = http.createServer(app);
var path = require("path");
var config = require("config/main");
// var proxy = require("app/middleware/proxy");
var compress = require("compression");
var morgan = require("morgan"); // logger
var bodyParser = require("body-parser");
var mongoose = require("mongoose"); //database
var cors = require("cors"); //middleware
var io = require("socket.io").listen(server);

app.use(compress());
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(morgan("dev"));

 app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
//    res.header("Content-Type", "application/json", "charset": "UTF-8" );
    next();
 });

// Connecting database

//mongoose.connect("mongodb://localhost:27017/test");

 process.env.MONGOLAB_URI="mongodb://Osedx:azerty123@ds019624.mlab.com:19624/heroku_469576p2";
 
mongoose.connect(process.env.MONGOLAB_URI, function (error) {
    if (error) console.error(error);
    else console.log("mongo connected");
});

var db = mongoose.connection;
mongoose.Promise = global.Promise;

// Models
var PlaylistDatabase = require("./src/app/components/models/playlist.database.model.ts");
var ToplistDatabase = require("./src/app/components/models/toplist.database.model.ts");
var RatingDatabase = require("./src/app/components/models/rating.database.model.ts");

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("Connected to MongoDB");

  // APIs
  // select all
  app.get("/playlist", function(req, res) {
    PlaylistDatabase.find({}, null,  {sort: {"rating": -1 }}, function(err, docs) {
      if(err) return console.error(err);
      res.json(docs);
    });
  });
    
  app.get("/toplist", function(req, res) {
    ToplistDatabase.find({}, null, function(err, docs) {
      if(err) return console.error(err);
      res.json(docs);
    });
  });
    
  app.get("/personalvideos/:id", function(req, res) {
    PlaylistDatabase.find({ uploaderid: req.params.id }, null,  {sort: {"rating": -1 }}, function(err, obj) {
      if(err) return console.error(err);
      res.json(obj);
    });
  });

  // count all
  app.get("/playlist/count", function(req, res) {
    PlaylistDatabase.count(function(err, count) {
      if(err) return console.error(err);
      res.json(count);
    });
  });
    
  // count all
  app.get("/toplist/count", function(req, res) {
    ToplistDatabase.count(function(err, count) {
      if(err) return console.error(err);
      res.json(count);
    });
  });

  // create
  app.post("/playlistitem", function(req, res) {
    var obj = new PlaylistDatabase(req.body);
    obj.save(function(err, obj) {
      if(err) return console.error(err);
      res.status(200).json(obj);
    });
  });

  // create
  app.post("/toplistitem", function(req, res) {
    var obj = new ToplistDatabase(req.body);
    obj.save(function(err, obj) {
      if(err) return console.error(err);
      res.status(200).json(obj);
    });
  });
    
  app.post("/rating", function(req, res) {
    var obj = new RatingDatabase(req.body);
    obj.save(function(err, obj) {
      if(err) return console.error(err);
      res.status(200).json(obj);
    });
  });    

  // find by id
  app.get("/playlistitem/:id", function(req, res) {
    PlaylistDatabase.findOne({_id: req.params.id}, function(err, obj) {
      if(err) return console.error(err);
      res.json(obj);
    });
  });

  // find by id
  app.get("/rating/:userid/:playlistitemid", function(req, res) {
    RatingDatabase.findOne({"userid": req.params.userid, "playlistitemid": req.params.playlistitemid }, function(err, obj) {
      if(err) return console.error(err);
      res.json(obj);
    });
  });
    
  // update by id
  app.put("/playlistitem/:id", function(req, res) {
    PlaylistDatabase.findOneAndUpdate({_id: req.params.id}, req.body, function(err) {
      if(err) return console.error(err);
      res.sendStatus(200);
    });
  });

  // delete by id
  app.delete("/playlistitem/:id", function(req, res) {
    PlaylistDatabase.findOneAndRemove({_id: req.params.id}, function(err) {
      if(err) return console.error(err);
      res.sendStatus(200);
    });
  });
    
   app.delete("/rating/:id", function(req, res) {
    RatingDatabase.findOneAndRemove({_id: req.params.id}, function(err) {
      if(err) return console.error(err);
      res.sendStatus(200);
    });
  });
    
   app.delete("/ratings/:playlistitemid", function(req, res) {
    RatingDatabase.remove({playlistitemid: req.params.playlistitemid}, function(err) {
      if(err) return console.error(err);
      res.sendStatus(200);
    });
  });   
    
    // Set static folder
    app.use(express.static(path.join(__dirname, config.server.publicPath)));

    // Load all custom routes
    require("app/routes")(app);

});

// Start the server
    server.listen(process.env.PORT || 3016, function() {
        console.log("app listening at http://localhost:%s running in %s mode.", process.env.PORT || 3016, process.env.NODE_ENV); // eslint-disable-line no-console
});

//io.set("origins", "*:*");

io.sockets.on("connection", function (socket) {
    console.log("New user connected: " +socket.id);
    socket.on("disconnect", function(){
    console.log("The user is disconnected"); });
    socket.on("updateplaylist", function(id){
        socket.broadcast.emit("playlistisupdated", id);
    });
    socket.on("deletefromplaylist", function(id){
        socket.broadcast.emit("itemdeleted", id);
    });
});

exports = module.exports = app;