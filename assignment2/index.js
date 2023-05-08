/** Required modules. */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoDB = require('connect-mongo');
const bcrypt = require('bcrypt');
const joi = require('joi');
const ObjectId = require('mongodb').ObjectId;
/** End of required modules. */

const port = 3020;
const images = ['marmot1.gif', 'marmot2.gif', 'marmot3.gif']
var saltRounds = 12;
const expireTime = 60 * 60 * 1000;
const app = express();
app.set('view engine', 'ejs');

/** Secret Info. */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_secretSession = process.env.MONGODB_SESSION_SECRET;
const nodeSecretSession = process.env.NODE_SESSION_SECRET;
/** End of secret info. */

/** Database connection. */
var {database} = require('./databaseConnection.js');

const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({extended: false}));

var mongoStore = mongoDB.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/Sessions`,
	crypto: {
		secret: mongodb_secretSession
	}
})
/** End of database connection. */

app.use(session({
    secret: nodeSecretSession,
	store: mongoStore,
	saveUninitialized: false,
	resave: true
}
))

function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

function sessionValidation(req,res,next) {
    if (isValidSession(req)) {
        next();
    }
    else {
        res.redirect('/login');
    }
}


function isAdmin(req) {
    if (req.session.user_type == 'admin') {
        return true;
    }
    return false;
}

function adminAuthorization(req, res, next) {
    if (!isAdmin(req)) {
        res.status(403);
        res.render("errorMessage", {error: "Not Authorized"});
        return;
    }
    else {
        next();
    }
}

/** Landing page. */
app.get('/', (req, res) => {
    res.render('index', {req: req});
})

/** Sign up page. */
app.get('/signup', (req, res) => {
    res.render('signup');
});


/** Sign up validation. */
app.post('/submitUser', async (req,res) => {
    var username = req.body.username;
    var email = req.body.email;
    var userType = 'user';
    var password = req.body.password;
    var html;
    // Check for missing fields
    if (!username) {
        html = `<h1>Sign up error</h1><p>Missing username</p><a href='/signup'>Try again</a>`;
        res.send(html);
        return;
    }
    if (!email) {
        html = `<h1>Sign up error</h1><p>Missing email</p><a href='/signup'>Try again</a>`;
        res.send(html);
        return;
    }
    if (!password) {
        html = `<h1>Sign up error</h1><p>Missing password</p><a href='/signup'>Try again</a>`;
        res.send(html);
        return;
    }
    
    // Check for noSQL injection attacks
	const schema = joi.object(
		{
			username: joi.string().alphanum().max(20).required(),
            email: joi.string().email().required(),
			password: joi.string().max(20).required()
		});
	// Validate user input
	const validationResult = schema.validate({username, email, password});
	if (validationResult.error != null) {
        console.log(validationResult.error);
        res.send(`<h1 style='color:darkred;'>WARNING: NOSQL INJECTION ATTACK DETECTED!</h1>
            <button onclick='window.location.href=\"/\"'>Home page</button>`);
	   return;
	}
    // Bcrypt password
    var hashedPassword = await bcrypt.hash(password, saltRounds);
	// Insert user into database
	await userCollection.insertOne({username: username, email: email, user_type: userType, password: hashedPassword});
	console.log("Inserted user");
    // Go to members page
    req.session.authenticated = true;
    req.session.username = username;
    req.session.user_type = userType
    req.session.cookie.maxAge = expireTime;
    console.log(req.session.user_type);
    res.redirect("/members");
});


/** Login page. */
app.get('/login', (req, res) => {
    res.render('login');
});

/** Login validation. */
app.post('/submitLogin', async (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

    // Create a joi object to check both email and password
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().max(20).required()
    });
    const validationResult = schema.validate({email, password});
	if (validationResult.error != null) {
        console.log(validationResult.error);
        res.send(`<h1 style='color:darkred;'>WARNING: NOSQL INJECTION ATTACK DETECTED!</h1>
            <button onclick='window.location.href=\"/\"'>Home page</button>`);
	   return;
	}
    // Find user details in database from email
	const result = await userCollection.find({email: email}).project({username: 1, user_type: 1, password: 1, _id: 1}).toArray();
    
	console.log(result);
    // User not found
	if (result.length != 1) {
		console.log("user not found");
		res.redirect("/login");
		return;
	}
    // Check password
	if (await bcrypt.compare(password, result[0].password)) {
		console.log("correct password");
		req.session.authenticated = true;
		req.session.username = result[0].username;
        req.session.user_type = result[0].user_type;
        console.log(req.session.user_type);
		req.session.cookie.maxAge = expireTime;

		res.redirect('/members');
		return;
    // Incorrect password
	} else {
        console.log("incorrect password");
        html = `<h1>Login error</h1><p>Incorrect password</p><a href='/login'>Try again</a>`;
        res.send(html);
        return;
	}
});

/** Members page. */
app.get('/members', (req, res) => {
    const marmot1 = "/marmot1.gif";
    const marmot2 = "/marmot2.gif";
    const marmot3 = "/marmot3.gif";
    res.render('members', {req: req, res: res, username: req.session.username, pic1: marmot1, pic2: marmot2, pic3: marmot3});
});

// Admin page
app.get('/admin', sessionValidation, adminAuthorization, async (req,res) => {
    const result = await userCollection.find().project({username: 1, user_type: 1, _id: 1}).toArray();
 
    res.render("admin", {users: result});
});

// Promote user to admin
app.post('/promoteUser/:id', sessionValidation, adminAuthorization, async (req,res) => {
  const id = req.params.id;
  const result = await userCollection.updateOne({_id: new ObjectId(id)}, {$set: {user_type: "admin"}});
  console.log("User promoted to admin");
  res.redirect('/admin');
});

// Demote admin to user
app.post('/demoteUser/:id', sessionValidation, adminAuthorization, async (req,res) => {
  const id = req.params.id;
  const result = await userCollection.updateOne({_id: new ObjectId(id)}, {$set: {user_type: "user"}});
  console.log("User demoted to user");
  res.redirect('/admin');
});

/** Logout page. */
app.get('/logout', (req,res) => {
    res.render('logout', {req: req, res: res});
});

app.use(express.static(__dirname + '/public'));

// 404 page
app.get("*", (req,res) => {
    res.render('404', {res: res});
})


// Start server
app.listen(port, () => {
    console.log("Node application listening on port " + port);
})
