/** Requirements. */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoStore = require('connect-mongodb-session');
const bcrypt = require('bcrypt');
const joi = require('joi');

const port = process.env.PORT || 3000;
const app = express();


/** Secret Info. */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.mongodb_user;
const mongodb_password = process.env.mongodb_password;
const mongodb_database = process.env.mongodb_database;
const mongodb_secretSession = process.env.MONGODB_SESSION_SECRET;
const mongodb_nodeSecretSession = process.env.NODE_SESSION_SECRET;

app.use(session({
    secret: mongodb_secretSession,
	// store: mongoStore, //default is memory store
	saveUninitialized: false,
	resave: true
}
));

app.get('/', (req, res) => {
    var html = "<a href='/signup'>Sign Up</a><br/>" + "<button>Log In</button>";
    res.send(html);
})

app.get('/signup', (req, res) => {
    var html = `
        <h1>Sign up</h1>
        <p>Create user</p>
        <form action='/submitUser' method='post'>
        <input name='username' type='text' placeholder='username' required><br/>
        <input name='email' type='text' placeholder='email' required><br/>
        <input name='password' type='password' placeholder='password' required><br/>
        <button>Submit</button>
        </form>`;
    res.send(html);
})

app.listen(port, () => {
    console.log("Node application listening on port " + port);
})
