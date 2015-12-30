/*
 * Canvas Of War
 * An online 2d multiplayer shooting game
 * https://github.com/7andahalf/
 * vinayck.com
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname));

var users = [];

io.on('connection', function(socket){

	socket.on('message', function(msg){
		io.emit('message', msg);
	});

	socket.on('game', function(msg){
		for(var j in users){
        	if(users[j][1] == socket.id){
        		users[j][2] = true;
        		io.emit('game', msg);
        		//console.log(users);
        		return;
        	}
        }
		users.push([msg.name, socket.id, true, 0, 0]);
		io.emit('game', msg);
		//console.log(users);
	});
	socket.on('disconnect', function(){
        for(var j in users){
        	if(users[j][1] == socket.id){
        		users[j][2] = false;
        		io.emit('game', {name : users[j][0], plposx : 10,  plposy : 10, gunang: 0, bull: 0});
        	}
        }
        //console.log(users);
    });
});

http.listen(3000, function(){
  console.log('Started server @ 3000');
});