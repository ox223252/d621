const fs = require ( 'fs' );

const express = require('express');
const bodyParser = require('body-parser');

var i2cBus = require("i2c-bus"); // https://github.com/101100/pca9685
var Pca9685Driver = require("pca9685").Pca9685Driver;

var app = express();
var server = require('http').createServer(app).listen(60004);
var io = require('socket.io').listen(server);

pwm = new Pca9685Driver({
	i2c: i2cBus.openSync(1),
	address: 0x40,
	frequency: 50,
	debug: false
}, function ( e )
{

});

app.use ( bodyParser.json( ) );
app.use ( bodyParser.urlencoded( {extended: true} ) );
app.use ( express.static ( __dirname + '/public' ) );

app.get ( '/', function ( req, res )
{
	res.render ( 'D621.ejs' );
});
app.get ( '/light', function ( req, res )
{
	res.render ( 'D621_light.ejs' );
});

app.use ( function ( err, req, res, next )
{
	console.log( "error : " + err.stack );
	res.statusCode = 404;
});

var D621 = {}
D621.nbClient = 0;
D621.dir = 0;
D621.speed = 0;
D621.step = 'forward';

pwm.setPulseRange( 13, 0, 0 );
pwm.setPulseRange( 12, 0, 0 );

io.on ( 'connection', function ( client )
{
	D621.nbClient++;

	client.emit ( 'speed', D621.speed );
	client.emit ( 'dir', D621.dir );
	client.emit ( 'step', D621.step );

	client.on ( 'speed', function ( data )
	{
		D621.speed = parseInt ( data );
		if ( D621.speed > 100 )
		{
			D621.speed = 100;
		}
		else if( D621.speed < -100 )
		{
			D621.speed = -100;
		}
		io.sockets.emit ( 'speed', D621.speed );

		if ( D621.speed >= 0 )
		{
			pwm.setPulseRange( 13, 0, 40 * D621.speed );
			pwm.setPulseRange( 12, 0, 0 );
		}
		else
		{
			pwm.setPulseRange( 13, 0, 4095 + 40 * D621.speed );
			pwm.setPulseRange( 12, 0, 4095 );
		}
	});
	client.on ( 'msg', function ( data )
	{
		console.log( data );
	});
	client.on ( 'step', function ( data )
	{
		D621.step = data;
		io.sockets.emit ( 'step', D621.step );
	});
	client.on ( 'dir', function ( data )
	{
		D621.dir = parseInt ( data );
		if ( D621.dir > 45 )
		{
			D621.dir = 45;
		}
		else if ( D621.dir < -45 )
		{
			D621.dir = -45;
		}
		io.sockets.emit ( 'dir', D621.dir );
		pwm.setPulseRange( 15, 0, 300 + 2 * D621.dir );
	});
	client.on ( 'disconnect', function ( client )
	{
		D621.nbClient--;

		if ( D621.nbClient == 0 )
		{
			D621.speed = 0;
		}
	});
	
	io.sockets.emit ( 'img', newPictureData );
});

// var pictureData;
// var newPictureData = new Buffer ( fs.readFileSync ( __dirname + '/public/imgs/picture.jpg' ) ).toString("base64");

// https://www.thepolyglotdeveloper.com/2016/02/convert-an-uploaded-image-to-a-base64-string-in-node-js/
// fs.watch(  __dirname + '/public/imgs/picture.jpg', function ( eventType, filename )
// {
// 	newPictureData = new Buffer ( fs.readFileSync ( __dirname + '/public/imgs/picture.jpg' ) ).toString("base64");

// 	if ( ( eventType != 'change' ) ||
// 		( newPictureData == pictureData ) ||
// 		( newPictureData == "" ) ||
// 		( newPictureData[ 0 ] != "/") )
// 	{
// 		return;
// 	}

// 	io.sockets.emit ( 'img', newPictureData );
// 	pictureData = newPictureData;
// });




