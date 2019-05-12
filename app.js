/*
Index.js - Entry point to serve up the Data Globe
*/

var express = require( 'express' );
var serveStatic = require( 'serve-static' );

var app = express();

// For CORS
app.use( function( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept" );
  res.header( "Access-Control-Allow-Methods", "GET" );

  if( req.method == 'OPTIONS' ) {
    res.json( [] );
  } else {
    next();
  }
});

app.use( serveStatic( __dirname, { 'index': ['index.html', 'index.htm' ] } ) );

app.listen( 8080 );

console.log( 'Listening on port 8080...' );
