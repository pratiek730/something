const fs = require('fs')
const path = require('path')
const https = require('https')
const express = require('express')
const helmet = require('helmet')
const passport = require('passport')
const { Strategy } = require('passport-google-oauth20')
const cookieSession = require('cookie-session');
const cors = require('cors')

require('dotenv').config();
const port = 3000;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2,
}

const AUTH_OPTIONS = {
    callbackURL: '/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,   
}


function verifyCallBack(accessToken, refreshToken, profile, done) //This is the access token I am asking about
{
    console.log('Google Profile', profile);
    done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallBack) )

passport.serializeUser((user,done)=>{
    done(null, user.id);
})

passport.deserializeUser((id,done)=>{
    console.log(id);
    done(null, id);
})

const app = express()

app.use(cors());




app.use(cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ],

}))


app.use(passport.initialize()) 

app.use(passport.session())


function checkLoggedIn(req,res,next) 
{    
    console.log('\n\n\nData in request :', req)
    isLoggedIn = req.isAuthenticated() && req.user;
    if(!isLoggedIn)
    {
        return res.status(401).json({
            error: 'You need to log in first',
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
        session: true,
    })    
);
    
app.get('/auth/logout',(req,res) => {
    req.logout();
    return res.redirect('/');
})




app.get('/secret', checkLoggedIn, (req, res) => {
    return res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

app.get('/failure',  (req,res) => {
    return res.send('Failed to log in!');
})

app.get('/styles.css',(req,res) => res.sendFile(path.join(__dirname,'node_modules', '@fortawesome', 'fontawesome-free' , 'css' , 'all.css')))

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html' )))



https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
},app).listen(port, () => console.log(`listening on port ${port}....`))