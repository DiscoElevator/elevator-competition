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
const usersRef = db.ref(config.urlDBName);

function writeUserName(userId, name) {
    return writeUserData(userId, name, null);
}
function writeUserData(userId, name, avatar) {
    return usersRef.child(userId).update({
        username: name,
        avatar: avatar
    });
}

var getShortToken = function (req) {
    var token = jwt.encode(req.body.name, config.secret);
    return token.substr(token.length - 20, 15);
};

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
    var shortToken = getShortToken(req); // = userID
    usersRef.orderByChild("username").equalTo(req.body.name).once("value", function(snapshot) {
        if (snapshot.val()) {
            res.status(403).send("Authentication failed. User already exist.");
        } else {
            writeUserName(shortToken, req.body.name).then(function() {
                res.status(200).send(shortToken);
            });
        }
    });
});

// for check real-time input name (only error response)
app.post("/check", function (req, res) {
    if (!req.body) return res.sendStatus(400);
    usersRef.orderByChild("username").equalTo(req.body.name).once("value", function(snapshot) {
        if (snapshot.val()) {
            res.status(403).send("User already exist.");
        } else {
            res.status(200).send("OK");
        }
    });
});

app.post("/avatar", function(req, res) {
    if (!req.body || !req.body.img || !req.body.name) return res.sendStatus(400);
    var shortToken = getShortToken(req);
    usersRef.orderByChild("username").equalTo(req.body.name).once("value", function(snapshot) {
        if (snapshot.val()) {
            writeUserData(shortToken, req.body.name, req.body.img).then(function() {
                res.status(200).send("Avatar OK");
            });
        } else {
            res.status(403).send("It is strange!");
        }
    });
});

app.listen(config.loginServerPort, function () {
    console.log(`Login server started on port: ${config.loginServerPort}`);
});
