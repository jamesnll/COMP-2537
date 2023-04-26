/** Required modules. */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoDB = require('connect-mongo');
const bcrypt = require('bcrypt');
const joi = require('joi');

const port = process.env.PORT || 3020;
var saltRounds = 12;
const app = express();

/** Secret Info. */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_secretSession = process.env.MONGODB_SESSION_SECRET;
const nodeSecretSession = process.env.NODE_SESSION_SECRET;

var {database} = require('./databaseConnection.js');

const userCollection = database.db(mongodb_database).collection('users');

app.use(express.urlencoded({extended: false}));

var mongoStore = mongoDB.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/Sessions`,
	crypto: {
		secret: mongodb_secretSession
	}
})

app.use(session({
    secret: nodeSecretSession,
	store: mongoStore, //default is memory store
	saveUninitialized: false,
	resave: true
}
))

/** Landing page. */
app.get('/', (req, res) => {
    var html = `
        <button onclick="window.location.href='/login'">Login</button><br/>
        <button onclick="window.location.href='/signup'">Sign up</button>`;
    res.send(html);
})

/** Sign up page. */
app.get('/signup', (req, res) => {
    var html = `
        <h1>Sign up</h1>
        <p>Create user</p>
        <form action='/submitUser' method='post'>
        <input name='username' type='text' placeholder='username'><br/>
        <input name='email' type='text' placeholder='email'><br/>
        <input name='password' type='password' placeholder='password'><br/>
        <button>Submit</button>
        </form>`;
    res.send(html);
});


/** Sign up validation. */
app.post('/submitUser', async (req,res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var html;
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
	const schema = joi.object(
		{
			username: joi.string().alphanum().max(20).required(),
            email: joi.string().email().required(),
			password: joi.string().max(20).required()
		});
	
	const validationResult = schema.validate({username, email, password});
	if (validationResult.error != null) {
	   console.log(validationResult.error);
	   res.redirect("/signup");
	   return;
   }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
	
	await userCollection.insertOne({username: username, password: hashedPassword});
	console.log("Inserted user");

    var html = "successfully created user";
    res.redirect("/members");
});

app.get('/loggedin', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }
    var html = `
    You are logged in!
    `;
    res.redirect("/members");
});

app.get("/members", (req, res) => {
    var html = `
    <h1>Members only</h1>
    <p>Members only content, no J-Den's allowed.</p>
    <button onclick="window.location.href='/logout'">Logout</button>
    `;
    res.send(html);
});


app.listen(port, () => {
    console.log("Node application listening on port " + port);
})
