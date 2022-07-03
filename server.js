const fs = require('fs')
const path = require('path')
const https = require('https')
const express = require('express')
const helmet = require('helmet')
const passport = require('passport')
const { Strategy } = require('passport-google-oauth20')


require('dotenv').config();
const port = 3000;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
}

const AUTH_OPTIONS = {
    callbackURL: '/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,   
}

var isLoggedIn = false;

function verifyCallBack(accessToken, refreshToken, profile, done) //This is the access token I am asking about
{
    console.log('Google Profile', profile);
    if(profile.__json.email == 'pratiek.parashar@gmail.com')
        isLoggedIn = true;
    
    done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallBack) )

const app = express()





app.use(helmet());

app.use(passport.initialize()) 

function checkLoggedIn(req,res,next) 
{    
    if(!isLoggedIn)
    {
        return res.status(401).json({
            error: 'Not authorized',
        })
    }    
    next();
}

app.get('/auth/google',passport.authenticate('google', {
    scope: ['email']
}))


app.get('/auth/google/callback',
    (req,res,next) => {
        console.log('Google Called Us Back')
        next();
    }, 
    passport.authenticate('google', {
        failureRedirect: '/failure',
        successRedirect: '/',
        session: false,
    })    
);
    
app.get('/auth/logout',(req,res) => {

})




app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send('Personal value is 42!!');
});

app.get('/failure',  (req,res) => {
    return res.send('Failed to log in!');
})

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html' )))



https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
},app).listen(port, () => console.log(`listening on port ${port}....`))