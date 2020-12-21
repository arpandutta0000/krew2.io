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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
var fireUI = new firebaseui.auth.AuthUI(firebase.auth());
var db = firebase.firestore();
var currentUser;


var firebaseRegister = function () {
    const name = $('#signup-email').val().trim();
    const signupEmail = name + '@krewio.com';
    const signupPassword = $('#signup-password').val();
    //Create User with Email and Password
    firebase.auth().createUserWithEmailAndPassword(signupEmail, signupPassword).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        if (errorMessage.includes('email address'))
            $('#firebase-register-error').addClass('d-block').text('This username is already registered.');
        else
            $('#firebase-register-error').addClass('d-block').text(errorMessage);
    }).then(function (result) {
        if (result) {
            $('#register-with-firebase-modal').modal('hide');
            const userId = result.user.uid;
            const userData = {
                name: name,
                level: 0,
                gold: 0
            };
            result.user.updateProfile({
                displayName: name
            });
            db.collection("users").doc(userId).set(userData).then(function () {
                    console.log("User successfully added to the DB!");
                })
                .catch(function (error) {
                    console.log("Error adding user to the DB: ", error);
                });
        }

    });
};

var firebaseLogin = function () {
    const signinEmail = $('#signin-email').val().trim() + '@krewio.com';
    const signinPassword = $('#signin-password').val();

    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

    //Sign In User with Email and Password
    firebase.auth().signInWithEmailAndPassword(signinEmail, signinPassword).then(function () {
        //console.log('logged in!');
        var user = firebase.auth().currentUser;
        if (user) {
            // User is signed in.
            var displayName = user.displayName;

            $('#login-with-firebase-modal').modal('hide');
            $('#login-with-firebase-button').hide();
            $('#play-button').removeClass('btn-success').addClass('btn-warning').text('Play as ' + displayName);
            $('#logged-in').html('You are logged in as <b>' + displayName + '</b>').show();
            $('#login-link').html('Logout').show();
            if (Mods.includes(displayName) || Admins.includes(displayName)) {
                $("#chat-message").attr('maxlength', '120');
            }

            return currentUser = {
                email: signinEmail,
                password: signinPassword
            };
            /*return user.getIdToken().then(function(idToken) {
				    currentUserID = user.uid;
				   	document.cookie = "loginToken=" + idToken;
	            	document.cookie = "username=" + displayName;
				  });*/
        }

    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
        $('#firebase-login-error').addClass('d-block').text(errorMessage);
    });
};

var firebaseLogout = function () {
    firebase.auth().signOut().then(function () {
        window.location = '/';
        // Sign-out successful.
    }).catch(function (error) {
        // An error happened.
    });

};