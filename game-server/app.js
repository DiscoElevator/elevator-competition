"use strict";

const app = require("http").createServer();
const io = require("socket.io")(app);
const firebase = require("firebase");
const config = require("./../config.json");

app.listen(config.gameServerPort);

firebase.initializeApp({
	databaseURL: config.databaseURL
});
const db = firebase.database();
const usersRef = db.ref(config.urlDBName);

io.on("connection", socketHandler);

function socketHandler(socket) {
	socket.on("ready", token => {
		usersRef.child(token).once("value")
			.then(data => data.val())
			.then(user => {
				if (user.score === undefined) {
					return updateUserScore(token, 0);
				} else {
					return user;
				}
			})
			.then(user => {
				socket.emit("user_score", {
					username: user.username,
					score: user.score
				});
				// recalculate positions and notify users
				getScores().then(emitScoreChange);
			});
	});
	socket.on("challenge_completed", userData => {
		let score = calculateScore(userData.data);
		updateUserScore(userData.token, score)
			.then(getScores)
			.then(emitScoreChange);
	});
}

function emitScoreChange(scores) {
	io.emit("scores_changed", scores);
}

function updateUserScore(token, score) {
	return usersRef.child(token).update({score});
}

function getScores() {
	return usersRef.orderByChild("score").once("value")
		.then(data => data.val())
		.then(objectToArray)
		.catch(console.error);

	function objectToArray(obj) {
		let result = [];
		Object.keys(obj).forEach(key => {
			result.push(obj[key]);
		});
		return result;
	}
}

function calculateScore(data) {
	return 0;
}