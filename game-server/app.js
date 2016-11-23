"use strict";

const app = require("http").createServer();
const io = require("socket.io")(app);
const firebase = require("firebase");
const config = require("./../config.json");
const LoggerFactory = require("./../utils/logger");

const logger = LoggerFactory.createLogger(config, "GameServer");

app.listen(config.gameServerPort, () => {
	logger.info(`Game server started on port: ${config.gameServerPort}`);
});

firebase.initializeApp({
	databaseURL: config.databaseURL
});
const db = firebase.database();
const usersRef = db.ref(config.urlDBName);

io.on("connection", socketHandler);

function socketHandler(socket) {
	socket.on("user_connected", token => {
		usersRef.child(token).once("value")
			.then(data => data.val())
			.then(user => {
                logger.info(`User connected: token=${token}, name=${user.username}`);
				return initializeUser(token, user);
			}).then(user => {
                sendNewScoreToUser(user.score);
				// recalculate positions and notify users
				getScores().then(emitScoreChange);
			});
	});
	socket.on("challenge_completed", userData => {
		let score = calculateScore(userData.data);
		logger.info(`User has completed challenge: token=${userData.token} level=${userData.data.level} score=${score}`);
        sendNewScoreToUser(score);
		let newLevel = userData.data.level + 1;
		updateUserData(userData.token, score, newLevel)
			.then(getScores)
			.then(emitScoreChange);
	});
	socket.on("get_scores", () => {
		logger.info("Results board connected");
        getScores().then(scores => {
            socket.emit("scores_changed", scores);
		});
	});

    function sendNewScoreToUser(score) {
        socket.emit("user_score", {
            score: score
        });
    }
}

function emitScoreChange(scores) {
	io.emit("scores_changed", scores);
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
		.catch(logger.error);

	function objectToArray(obj) {
		let result = [];
		Object.keys(obj).forEach(key => {
			result.push(obj[key]);
		});
		return result;
	}

	function getUserScore(user) {
	    return {
	        name: user.username,
			points: user.score,
			level: user.level,
			avatar: user.avatar
        };
    }
}

function calculateScore(data) {
	return data.level * 10;
}