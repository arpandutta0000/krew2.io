var firebase = require("firebase");
var firebaseConfig = {
  apiKey: "AIzaSyBCmgICn2znGdbBtPbERHTB-_9TOXmxLrs",
  authDomain: "krew-f6583.firebaseapp.com",
  databaseURL: "https://krew-f6583.firebaseio.com",
  projectId: "krew-f6583",
  storageBucket: "krew-f6583.appspot.com",
  messagingSenderId: "498335025734",
  appId: "1:498335025734:web:1869a0677aff413cb71847",
  measurementId: "G-L2HLCJ0YY0"
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
//firebase.initializeApp();

var firebaseDB = firebase.firestore();


function returnUserData(userID, callback) {
		   firebaseDB.collection("users").doc(userID).get().then(function(doc) {
		   	if(doc.exists)
	   			return callback(doc.data());
		}).catch((e) => {
    		console.log("Error getting user data: ", e);
  	});
}

function InsertOne(collection, id, obj) {
		   firebaseDB.collection(collection).doc(id).set(obj).catch((e) => {
    		console.log("Error adding user to the DB: ", e);
  	});
}

function DeleteOne(collection, id, callback) {
		firebaseDB.collection(collection).doc(id).delete().then(function() {
	   		return callback();
		}).catch((e) => {
    		console.log("Error removing user data: ", e);
  	});
}

function ReturnAllBannedIPs(collection, callback) {
	   firebaseDB.collection(collection).get().then(function(snapshot) {
   		const tempDoc = [];
   		snapshot.forEach((doc) => {
   			tempDoc.push({id: doc.id, playerName: doc.data().playerName, IP: doc.data().IP});
   		})
   		return callback(tempDoc);
	}).catch((e) => {
		console.log("Error returning banned IPs: ", e);
	});
}

function ReturnAllClans(collection, callback) {
	   firebaseDB.collection(collection).get().then(function(snapshot) {
   		const tempDoc = [];
   		snapshot.forEach((doc) => {
   			tempDoc.push({clanName: doc.id});
   		})
   		return callback(tempDoc);
	}).catch((e) => {
		console.log("Error returning all clans: ", e);
	});
}

function UpdateOneWithQuery(collection,id,obj,createNew, callback) {

	if(!createNew)
	{
	   firebaseDB.collection(collection).doc(id).update(obj).then(function() {
			return callback();
		}).catch((e) => {
			console.log("Error updating data: ", e);
			});
	}
	else
	{
		firebaseDB.collection(collection).doc(id).get().then(function(doc) {
			if(doc.exists)
			{
				// don't create
				console.log('doc already exists');
				return(callback());
			}
			else
			{
	   			firebaseDB.collection(collection).doc(id).set(obj).catch((e) => {
				console.log("Error adding user to the DB: ", e);
				});   						
			}
		})
	}
}

function IncrementAndUpdate(collection,id,variable,value, callback) {
	const increment = firebase.firestore.FieldValue.increment(value);
   firebaseDB.collection(collection).doc(id).update({[variable]: increment}).then(function() {
				return callback();
	}).catch((e) => {
		console.log("Error incrementing/updating data: ", e);
		});    
}

function IncrementAndReturn(collection,id,variable,value, callback) {
	const increment = firebase.firestore.FieldValue.increment(value);
   firebaseDB.collection(collection).doc(id).update({[variable]: increment}).then(function() {
				firebaseDB.collection(collection).doc(id).get().then(function(doc) {
					if(doc.exists)
						return callback(doc.data());
				})
	}).catch((e) => {
		console.log("Error incrementing/returning data: ", e);
		});    
}  

function ReturnResultAndUpdate(collection,id,obj,postUpdate, callback) {
	if(!postUpdate)
	{


			firebaseDB.collection(collection).doc(id).get().then(function(snap) {
				if(snap.exists)
				{
					firebaseDB.collection(collection).doc(id).update(obj).then(function() {
					firebaseDB.collection(collection).doc(id).get().then(function(doc) {
						if(doc.exists)
							return callback(doc.data());
					})
				})
				}
				else
					console.log('Not created yet!');

		}).catch((e) => {
		    	console.log("Error returning data and updating: ", e);
		 }); 

	}
	else
	{
		firebaseDB.collection(collection).doc(id).set(obj).then(function() {
			firebaseDB.collection(collection).doc(id).get().then(function(doc) {
				if(doc.exists)
					return callback(doc.data());
			})
		}).catch((e) => {
		    	console.log("Error creating new data: ", e);
		  }); 
	}
}

function RemoveLeaderAndUpdate(id,deletedValue, callback) {

	firebaseDB.collection('clans').doc(id)
	.update({clanLeader: firebase.firestore.FieldValue.arrayRemove(deletedValue),
		clanMembers: firebase.firestore.FieldValue.arrayRemove(deletedValue)}).then(function() {
			firebaseDB.collection('clans').doc(id).get().then(function(doc) {
				if(doc.exists)
					return callback(doc.data());
			})    				
		}).catch((e) => {
			    	console.log("Error removing leader and updating clan data: ", e);
		});
}

function ReturnSingleValue(collection,id, callback) {
		   firebaseDB.collection(collection).doc(id).get().then(function(doc) {
		   	if(doc.exists)
	   			return callback(doc.data());
		}).catch((e) => {
    		console.log("Error returning value from database: ", e);
  	});
}

function ReturnAndSort(collection,sort, limit, callback) {
	   firebaseDB.collection(collection).orderBy(sort,"desc").limit(20).get().then(function(snapshot) {
   		
	   	const tempDoc = [];
   		snapshot.forEach((doc) => {
   			tempDoc.push({playerName: doc.data().playerName, clan: doc.data().clan, highscore: doc.data().highscore});
   			
   		})
   		return callback(tempDoc);
	}).catch((e) => {
		console.log("Error returning sorted data: ", e);
	});
}

function ManagePlayerInClan(action, playerName, clanName, callback) {
	//var upsertPlayer = false;
    //var upsertClan = false;
    if (action === "kick") {
        //var updateClan = {$pull: {clanMembers: playerName}};
        //var updatePlayer = {$set: {clan: "", clanLeader: false}}


		firebaseDB.collection('clans').doc(clanName)
		.update({clanMembers: firebase.firestore.FieldValue.arrayRemove(playerName)})
		.then(function() {
			firebaseDB.collection('players').doc(playerName)
			.update({clan: "", clanLeader: false}).then(function() {
					return callback();
				})	
		}).catch((e) => {
				 console.log("Error updating clan/user data: ", e);
		}); 
    }
    else if (action === "kick-leader") {
        //updateClan = {$pull: {clanMembers: playerName, clanLeader: playerName}};
        //updatePlayer = {$set: {clan: "", clanLeader: false}}

		firebaseDB.collection('clans').doc(clanName)
		.update({clanMembers: firebase.firestore.FieldValue.arrayRemove(playerName),
			clanLeader: firebase.firestore.FieldValue.arrayRemove(playerName)})
		.then(function() {
			firebaseDB.collection('players').doc(playerName)
			.update({clan: "",clanLeader: false}).then(function() {
					return callback();
				})
		}).catch((e) => {
				 console.log("Error updating clan/user data: ", e);
		}); 
    }
    else if (action === "promote") {
        //updateClan = {$addToSet: {clanLeader: playerName}};
        //updatePlayer = {$set: {clan: clanName, clanLeader: true}}

		firebaseDB.collection('clans').doc(clanName)
		.update({clanLeader: firebase.firestore.FieldValue.arrayUnion(playerName)})
		.then(function() {
			firebaseDB.collection('players').doc(playerName)
			.update({clan: clanName, clanLeader: true}).then(function() {
					return callback();
				})
		}).catch((e) => {
				 console.log("Error updating clan/user data: ", e);
		}); 
    }
    else if (action === "join") {
        //updateClan = {$addToSet: {clanRequests: playerName}};
        //updatePlayer = {$set: {clanRequest: clanName}}

		firebaseDB.collection('clans').doc(clanName)
		.update({clanRequests: firebase.firestore.FieldValue.arrayUnion(playerName)})
		.then(function() {
			firebaseDB.collection('players').doc(playerName)
			.update({clanRequest: clanName}).then(function() {
					return callback();
				})
		}).catch((e) => {
				 console.log("Error updating clan/user data: ", e);
		}); 

    }
    else if (action === "accept") {
        //updateClan = {$addToSet: {clanMembers: playerName}, $pull: {clanRequests: playerName}};
        //updatePlayer = {$set: {clan: clanName, clanLeader: false, clanRequest: ""}}

		firebaseDB.collection('clans').doc(clanName)
		.update({clanMembers: firebase.firestore.FieldValue.arrayUnion(playerName),
			clanRequests: firebase.firestore.FieldValue.arrayRemove(playerName)})
		.then(function() {
			firebaseDB.collection('players').doc(playerName)
			.update({clan: clanName, clanLeader: false, clanRequest: ""}).then(function() {
					return callback();
				})
		}).catch((e) => {
				 console.log("Error updating clan/user data: ", e);
		}); 
    }
    else if (action === "decline") {
        //updateClan = {$pull: {clanRequests: playerName}};
        //updatePlayer = {$set: {clanRequest: ""}}

		firebaseDB.collection('clans').doc(clanName)
		.update({clanRequests: firebase.firestore.FieldValue.arrayRemove(playerName)})
		.then(function() {
			firebaseDB.collection('players').doc(playerName)
			.update({clanRequest: ""}).then(function() {
					return callback();
				})
		}).catch((e) => {
				 console.log("Error updating clan/user data: ", e);
		}); 
    }
    else if (action === "create"){
        //upsertClan = true;
        //updateClan = {$setOnInsert: {clanName: clanName, clanOwner: playerName, clanLeader: [playerName], clanMembers: [playerName]}};
        //updatePlayer = {$set: {clan: clanName, clanLeader: true, clanOwner: true}}


        firebaseDB.collection('clans').doc(clanName).set({clanName: clanName}).then(function() {
			firebaseDB.collection('clans').doc(clanName)
			.update({clanOwner: playerName, clanLeader: firebase.firestore.FieldValue.arrayUnion(playerName),
				clanMembers: firebase.firestore.FieldValue.arrayUnion(playerName)})
			.then(function() {
				firebaseDB.collection('players').doc(playerName)
				.update({clan: clanName, clanLeader: true, clanOwner: true}).then(function() {
					return callback();
				})
				})	        	
        	}).catch((e) => {
					 console.log("Error updating clan/user data: ", e);
			}); 
    }
}

exports.firebase = firebase;
exports.returnUserData = returnUserData;
exports.InsertOne = InsertOne;
exports.DeleteOne = DeleteOne;
exports.UpdateOneWithQuery = UpdateOneWithQuery;
exports.IncrementAndUpdate = IncrementAndUpdate;
exports.IncrementAndReturn = IncrementAndReturn;
exports.ReturnAllBannedIPs = ReturnAllBannedIPs;
exports.ReturnAllClans = ReturnAllClans;
exports.ReturnResultAndUpdate = ReturnResultAndUpdate;
exports.RemoveLeaderAndUpdate = RemoveLeaderAndUpdate;
exports.ReturnSingleValue = ReturnSingleValue;
exports.ReturnAndSort = ReturnAndSort;
exports.ManagePlayerInClan = ManagePlayerInClan;