// connection to local mongo db is done in this file. Functions for read/write operations: mongo_functions.js
const MongoClient = require( 'mongodb' ).MongoClient;
const url = "mongodb://localhost:27017";
var _db;

module.exports = {
    connectToServer: function( callback ) {
        MongoClient.connect( url, { useNewUrlParser: true, useUnifiedTopology: true }, function( err, client ) {
            _db  = client.db('localKrewDB');
            return callback( err );
        } );
    },

    getDb: function() {
        return _db;
    },
};
