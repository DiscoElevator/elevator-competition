const express = require("express");
const jwt = require("jwt-simple");
const bodyParser = require("body-parser");
const firebase = require("firebase");
const config = require("./../config.json");

// input real parameters for db
firebase.initializeApp({
    serviceAccount: config.serviceAccount,
    databaseURL: config.databaseURL
});
const db = firebase.database();
const ref = db.ref(config.urlDBName);

function writeUserData(userId, name) {
    db.ref(config.urlDBName + userId).set({
        username: name
        //profile_picture : imageUrl
    });
}

const app = express();
const urlencodedParser = bodyParser.urlencoded({extended: false});
app.use(urlencodedParser);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/", function(req, res, next) {
    // Handle the get for this route
});

app.post("/", function(req, res, next) {
    // Handle the post for this route
});

// for action on button click
app.post("/login", function (req, res) {
    if (!req.body || !req.body.name) return res.sendStatus(400);
    var token = jwt.encode(req.body.name, config.secret);
    var shortToken = token.substr(token.length - 20, 15); // = userID
    ref.orderByChild("username").equalTo(req.body.name).once("value", function(snapshot) {
        if (snapshot.val()) {
            res.status(403).send("Authentication failed. User already exist.");
        }
        else {
            writeUserData (shortToken, req.body.name);
            res.status(200).send(shortToken);
        }
    });
});

// for check real-time input name (only error response)
app.post("/check", function (req, res) {
    if (!req.body) return res.sendStatus(400);
    ref.orderByChild("username").equalTo(req.body.name).once("value", function(snapshot) {
        if (snapshot.val()) {
            res.status(403).send("User already exist.");
        }
        else {
            res.status(200).send("OK");
        }
    });
});

app.listen(3002, function () {
    console.log("App listening on port 3002!");
});