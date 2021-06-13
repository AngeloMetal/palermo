const express = require('express');
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');
var mysql = require('mysql');

const app = express();

const server = createServer(app);
const wss = new WebSocket.Server({ server });

// By changing this to true, the game will be exclusively for testing purposes. 
// On testnet:  1st is secret_m, 2nd is the spy and the last one is apparent_m
var testnet = false;

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "palermo"
});

con.connect((err) => {
    if (err) {
        throw err;
    }

    console.log('Connected to database');
});

wss.broadcast = function(data) {
  wss.clients.forEach(client => client.send(data));
};

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

wss.on('connection', function(ws) {
	ws.id = wss.getUniqueID();
  console.log("client joined.");
  ws.on('message', function(data) {
	
		if(data.includes("createRoom")){
			// if username is not null
			var username = data.split(",")[1].split(":")[1];
			var pass = data.split(",")[2].split(":")[1];
			if(username != null){
				wss.broadcast("addtolobby:"+username + ",pass:" + pass);
			}
		}
		
		if(data.includes("joinRoom")){
			// if username is not null
			var username = data.split(",")[1].split(":")[1];
			var pass = data.split(",")[2].split(":")[1];
			if(username != null){
				wss.broadcast("addtolobby:"+username + ",pass:" + pass);
			}
		}
		
		if(data.includes("startRoom")){
			console.log("Received: " + data)
			
			// if username is not null
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			var withKamikaze = data.split(",")[2].split(":")[1].substring(0,1)
			
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				console.log("players: " + result[0].players)
				var items = result[0].players.split(",")
				var newItems = [];
				
				
				
				var newItemsString = "";
				
				// Main Game
				if(testnet == false){
					for (var i = 0; i < 4; i++) {
					  var idx = Math.floor(Math.random() * items.length);
					  newItems.push(items[idx]);
					  items.splice(idx, 1);
					}
					for(var i = 0; i<4; i++){
						newItemsString += newItems[i] + ",";
					}
				}
				
				//Test game
				if(testnet == true){
					newItemsString += items[0] + ",";
					newItemsString += items[items.length-1] + ",";
					newItemsString += items[1] + ",";
					newItemsString += items[2] + ",";
				}
			
				newItemsString = newItemsString.slice(0, -1);
				
				con.query("UPDATE rooms SET roles = '"+newItemsString+"' WHERE pass = '" + pass + "'")
					wss.broadcast("startRoom:" + pass + ",withKamikaze:" + withKamikaze);
			})
		}
		
		if(data.includes("giveRole")){
			var pass = data.split(",")[2].split(":")[1].substring(0,5)
			var username = data.split(",")[1].split(":")[1]
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				var position = 0;
				for(var i=1; i<5; i++){
					if(result[0].kamikaze == 1 && i == 4){
						if(result[0].roles.split(",")[i-1] == username){
							position = i
						}
					}else if(result[0].roles.split(",")[i-1] == username){
						position = i
					}
					
				}
				
				ws.send("allPlayers:" + result[0].players + "|pass:" + pass)
				ws.send("position:" + position + ",pass:" + pass)
				//στέλνει όλα τα players για PlayerPrefs:
				
			})
		}
		
		if(data.includes("murderers_look_each_other")){
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			var username = data.split(",")[2].split(":")[1]
			var role = data.split(",")[3].split(":")[1]
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				var murdererNumber = 0;
				if(role == "secret_m"){
					murdererNumber = 2
				}
				if(role == "apparent_m"){
					murdererNumber = 1
				}
				console.log("otherMurderer:" + result[0].roles.split(",")[murdererNumber-1])
				ws.send("otherMurderer:" + result[0].roles.split(",")[murdererNumber-1] + ",pass:" + pass)
			})
			
		}
		
		if(data.includes("spy_sees_apparent")){
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			var username = data.split(",")[2].split(":")[1]
			var role = data.split(",")[3].split(":")[1]
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				console.log("apparent murderer:" + result[0].roles.split(",")[1])
				ws.send("appMurderer:" + result[0].roles.split(",")[1] + ",pass:" + pass)
			})
			
		} 
		if(data.includes("action:vote")){
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			var suspect = data.split(",")[2].split(":")[1]
			
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				//console.log("Suspicious players: " + result[0].suspects)
				wss.broadcast("suspect:" + suspect + ",pass:" + pass)
			})
		}
		
		if(data.includes("action:addMaxPlayer")){
			var pass = data.split(",")[2].split(":")[1].substring(0,5)
			var maxPlayer = data.split(",")[1].split(":")[1]
			//Προσθέτει τον suspect στο 'suspects' table
			con.query("UPDATE rooms SET suspects = CONCAT(suspects, '"+maxPlayer+"', ',') WHERE pass = '"+pass+"'")
		}
		
		if(data.includes("suggest")){
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			var suggested = data.split(",")[2].split(":")[1]
			var from = data.split(",")[3].split(":")[1]
			
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				//console.log("Suspicious players: " + result[0].suspects)
				con.query("UPDATE rooms SET suspects = CONCAT(suspects, '"+suggested+"', ',') WHERE pass = '"+pass+"'")
				wss.broadcast("suggested:" + suggested + ",from:" + from + ",pass:" + pass)
			})
		}
		if(data.includes("action:agreement")){
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			var deadPlayer = data.split(",")[2].split(":")[1]
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				//console.log("Suspicious players: " + result[0].suspects)
				if(result[0].roles.split(',')[3] == deadPlayer){
					con.query("UPDATE rooms SET kamikaze=2 WHERE pass = '"+pass+"'")
				}
				
			})
			
			wss.broadcast("deadPlayer:" + deadPlayer + ",pass:" + pass)
		}
		
		if(data.includes("action:disagreement")){
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			var voter = data.split(",")[2].split(":")[1]
			wss.broadcast("action:disagreement,voter:" + voter + ",pass:" + pass)
		}
		
		if(data.includes("action:checkGame")){
			var pass = data.split(",")[1].split(":")[1].substring(0,5)
			con.query("SELECT * FROM rooms WHERE pass = '"+pass+"'", function(err, result, fields) {
				if (err) throw err;
				var murderersLeft = 0;
				var arrPlayers = result[0].players.split(",")
				var arrSuspects = result[0].suspects.split(",")
				var arrRoles = result[0].roles.split(",")
				for(var i=0; i<arrPlayers.length; i++){
						for(var j=0; j<2; j++){
							if(arrPlayers[i] == arrRoles[j]){
								murderersLeft += 1;
							}
						}
				}
				for(var i=0; i<arrRoles.length-1; i++){
						for(var j=0; j<arrSuspects.length; j++){
							if(arrRoles[i] == arrSuspects[j]){
								murderersLeft -= 1;
							}
						}
				}
			
				console.log("total murderers: " + murderersLeft)
				console.log("total players (without the murderers): " + (arrPlayers.length-2))
				console.log("total suspects: " + (arrSuspects.length-1))
				
				var kamikaze_winner = false;
				
				//τσεκάρει για καμικάζι
				if(result[0].kamikaze == 1){
					for(var j=0; j<arrSuspects.length; j++){
								if(arrRoles[3] == arrSuspects[j]){
									wss.broadcast("winners:kamikaze,pass:"+pass+",murderers:"+arrRoles[0]+"."+arrRoles[1]+",spy:"+arrRoles[2]+",kamikaze:"+arrRoles[3])
									kamikaze_winner = true;
								}
					}
				}
				
				if(kamikaze_winner == false){
					//Εάν δολοφόνοι = 2 και οι άλλοι <= 2 τότε νικούν οι δολοφόνοι
					if(murderersLeft == 2 && ((arrPlayers.length-2) - (arrSuspects.length-1)) <= 2){
						console.log("gameover,murderersLeft:2,playersLeft:<=2")
						wss.broadcast("winners:murderers,pass:"+pass+",murderers:"+arrRoles[0]+"."+arrRoles[1]+",spy:"+arrRoles[2]+",kamikaze:"+arrRoles[3])
					}else if(murderersLeft == 1 && ((arrPlayers.length-2) - (arrSuspects.length-1)) <= 1){
						console.log("gameover,murderersLeft:1,playersLeft:1")
						wss.broadcast("winners:murderers,pass:"+pass+",murderers:"+arrRoles[0]+"."+arrRoles[1]+",spy:"+arrRoles[2]+",kamikaze:"+arrRoles[3])
					}else if(murderersLeft == 0){
						wss.broadcast("winners:polites,pass:"+pass+",murderers:"+arrRoles[0]+"."+arrRoles[1]+",spy:"+arrRoles[2]+",kamikaze:"+arrRoles[3])
					}
				}
				
				
				
			})
		}
  });

  ws.on('close', function() {
    console.log("client left.");
  });
});

server.listen(5002, function() {
  console.log('Listening on localhost:5002');
});

setInterval(function () {
    con.query('SELECT 1');
}, 10000);
