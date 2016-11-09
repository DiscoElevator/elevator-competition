const express = require("express");
const jwt = require("jwt-simple");
const bodyParser = require("body-parser");
const firebase = require("firebase");
const config = require("./../config.json");

firebase.initializeApp({
    serviceAccount: config.serviceAccount,
    databaseURL: config.databaseURL
});
const db = firebase.database();
const ref = db.ref(config.urlDBName);

function writeUserName(userId, name) {
    db.ref(config.urlDBName + userId).set({
        username: name
    });
}
function writeUserData(userId, name, img) {
    db.ref(config.urlDBName + userId).set({
        username: name,
        avatar: img
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
});

app.post("/", function(req, res, next) {
});

// for action on button click Login
app.post("/login", function (req, res) {
    if (!req.body || !req.body.name) return res.sendStatus(400);
    var token = jwt.encode(req.body.name, config.secret);
    var shortToken = token.substr(token.length - 20, 15); // = userID
    ref.orderByChild("username").equalTo(req.body.name).once("value", function(snapshot) {
        if (snapshot.val()) {
            res.status(403).send("Authentication failed. User already exist.");
        }
        else {
            writeUserName (shortToken, req.body.name);
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

app.post("/avatar", function(req, res) {
    if (!req.body || !req.body.img || !req.body.name) return res.sendStatus(400);
    var token = jwt.encode(req.body.name, config.secret);
    var shortToken = token.substr(token.length - 20, 15);
    ref.orderByChild("username").equalTo(req.body.name).once("value", function(snapshot) {
        if (snapshot.val()) {
            writeUserData(shortToken, req.body.name, req.body.img);
            res.status(200).send("Avatar OK");
        }
        else {
            res.status(403).send("It is strange!");
        }
    });
});

app.listen(3002, function () {
    console.log("App listening on port 3002!");
});
