"use strict";

const app = require("http").createServer();
const io = require("socket.io")(app);
const firebase = require("firebase");
const config = require("./../config.json");

app.listen(config.gameServerPort, () => {
	console.log(`Game server started on port: ${config.gameServerPort}`)
});

firebase.initializeApp({
	databaseURL: config.databaseURL
});
const db = firebase.database();
const usersRef = db.ref(config.urlDBName);

io.on("connection", socketHandler);

function socketHandler(socket) {
    // socket.emit("user_score", {
    //     score: 100
    // });
	socket.on("user_connected", token => {
		usersRef.child(token).once("value")
			.then(data => data.val())
			.then(user => {
				return initializeUser(token, user);
			}).then(user => {
                sendNewScoreToUser(user.score);
				// recalculate positions and notify users
				getScores().then(emitScoreChange);
			});
	});
	socket.on("challenge_completed", userData => {
		let score = calculateScore(userData.data);
        sendNewScoreToUser(score);
		let newLevel = userData.data.level + 1;
		updateUserData(userData.token, score, newLevel)
			.then(getScores)
			.then(emitScoreChange);
	});

    function sendNewScoreToUser(score) {
        socket.emit("user_score", {
            score: score
        });
    }
}

function emitScoreChange(scores) {
	io.emit("scores_changed", scores);
	console.log("change: ", scores);
}

function updateUserData(token, score, level) {
	return usersRef.child(token).update({score, level});
}

function initializeNewUser(token) {
	return updateUserData(token, 0, 1);
}
function initializeUser(token, user) {
    if (user.score === undefined) {
        return initializeNewUser(token).then(() => {return user;});
    } else {
        return Promise.resolve(user);
    }
}

function getScores() {
	return usersRef.orderByChild("score").once("value")
		.then(data => data.val())
		.then(objectToArray)
        .then(users => users.map(getUserScore))
		.catch(console.error);

	function objectToArray(obj) {
		let result = [];
		Object.keys(obj).forEach(key => {
			result.push(obj[key]);
		});
		return result;
	}

	function getUserScore(user) {
	    return {
	        username: user.username,
            score: user.score
        };
    }
}

function calculateScore(data) {
	return 0;
}