# palermo
Source code of Palermo client (Node JS, PHP scripts, MySQL)

Requirements for running a palermo server:
1) Node JS v12.19.0 (I haven't tested prior 12 but it should work on v10.xx.x too)
2) PHP 7.x/8.x
3) Apache 2.x+
4) MySQL 5.7+

Required libraries for node js. 
1) express
2) path
3) http
4) ws
5) mysql

You can install them with ``npm install <library_name>`` on your command prompt.

I've set ``server.js`` listening to port 5002 and that <b>should not be changed</b>. The unity game's files aren't open source (not at the moment), and they listen to port 5002 too, so it won't establish the connection properly. 

By importing the database into your phpmyadmin, pasting the php files on htdocs (with the analogous edits) and by simply entering ``node server.js`` on your cmd, then the server will be running.

<i>The above server files are exclusively for v0.2</i>
