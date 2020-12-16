// functions for mongo db read/write operations
var mongoConnection = require('./core_mongo_connection');
var db = mongoConnection.getDb();

// simple insert to DB function
function InsertOne(collection, myobj) {
    mongoConnection.getDb().collection(collection).insertOne(myobj)
    // TODO: catch promise
}

// simple delete from DB function
function DeleteOne(collection, myobj, callback) {
    mongoConnection.getDb().collection(collection).deleteOne(myobj).then((result) => {
        callback(result)
    })
}

// return all items in a collection
function ReturnAll(collection, projection, callback) {
    mongoConnection.getDb().collection(collection).find({}, projection).toArray().then((result) => {
        callback(result)
    })
}

// find one result (with query) and update it (with myobj)
// use upsert = true to create new record if record does not exist
function UpdateOneWithQuery (collection, query, myobj, upsert, callback) {
    mongoConnection.getDb().collection(collection).updateOne(query, myobj, { upsert: upsert }).then((result) => {
        callback(result)
    })
}

// return a document based on the query and update it with myobj
function ReturnResultAndUpdate (collection, query, myobj, upsert, callback) {
    db.collection(collection).findOneAndUpdate(query, myobj, { upsert: upsert }).then((result) => {
        callback(result)
    })
}

// return a single document based on the query
function ReturnSingleValue (collection, query, callback) {
    db.collection(collection).findOne(query, { _id: 0 }).then((result) => {
        callback(result)
    })
}

// return multiple documents sorted by one field
function ReturnAndSort (collection, query, fields, sort, count, callback) {
    // TODO: handle promise properly
    db.collection(collection).find(query, fields).sort(sort).limit(count).toArray(function (err, result) {
        callback(result);
    })
}

// remove a player from a clan or promote a player to be clan leader
function ManagePlayerInClan (action, playerName, clanName, callback) {
    var upsertPlayer = false;
    var upsertClan = false;
    if (action === "kick") {
        var updateClan = {$pull: {clanMembers: playerName}};
        var updatePlayer = {$set: {clan: "", clanLeader: false}}
    }
    else if (action === "kick-leader") {
        updateClan = {$pull: {clanMembers: playerName, clanLeader: playerName}};
        updatePlayer = {$set: {clan: "", clanLeader: false}}
    }
    else if (action === "promote") {
        updateClan = {$addToSet: {clanLeader: playerName}};
        updatePlayer = {$set: {clan: clanName, clanLeader: true}}
    }
    else if (action === "join") {
        updateClan = {$addToSet: {clanRequests: playerName}};
        updatePlayer = {$set: {clanRequest: clanName}}
    }
    else if (action === "accept") {
        updateClan = {$addToSet: {clanMembers: playerName}, $pull: {clanRequests: playerName}};
        updatePlayer = {$set: {clan: clanName, clanLeader: false, clanRequest: ""}}
    }
    else if (action === "decline") {
        updateClan = {$pull: {clanRequests: playerName}};
        updatePlayer = {$set: {clanRequest: ""}}
    }
    else if (action === "create"){
        upsertClan = true;
        updateClan = {$setOnInsert: {clanName: clanName, clanOwner: playerName, clanLeader: [playerName], clanMembers: [playerName]}};
        updatePlayer = {$set: {clan: clanName, clanLeader: true, clanOwner: true}}
    }
    mongoConnection.getDb().collection('players').updateOne({playerName: playerName}, updatePlayer, { upsert: upsertPlayer }).then((result) => {
        if (result['result']['nModified'] === 1) {
            mongoConnection.getDb().collection('clans').updateOne({clanName: clanName}, updateClan, { upsert: upsertClan }).then((result) => {
                callback(result)
            })
        }
        else {
            console.log("Mongo Error: Action", action, "FAILED | Player name:", playerName, "| Clan name:", clanName)
        }
    });
}

exports.InsertOne = InsertOne;
exports.DeleteOne = DeleteOne;
exports.ReturnAll = ReturnAll;
exports.UpdateOneWithQuery = UpdateOneWithQuery;
exports.ReturnResultAndUpdate = ReturnResultAndUpdate;
exports.ReturnSingleValue = ReturnSingleValue;
exports.ReturnAndSort = ReturnAndSort;
exports.ManagePlayerInClan = ManagePlayerInClan;