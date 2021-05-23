require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const notification = require('./routes/notification');
const user = require('./routes/user');
const smokingData = require('./routes/smokingData');
const favicon = require('serve-favicon');

const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use(cors(
    {
        origin: ['http://localhost:3000', 'http://localhost:5000', 'https://smokeapipe.netlify.app'],
        methods: ['GET', 'POST'],
        credentials: true,
        exposedHeaders: ["set-cookie"],
    }
));
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(session({
    name: 'userId',
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));
app.use('/notification', notification);
app.use('/user', user);
app.use('/smokingData', smokingData);


function authenticateToken(req, res, next) {
    const authHeader = req.headers['Authorization'];
    const token = authHeader && authHeader.split('')[1];
    if (token == null) { res.json({ auth: false, success: false, message: 'No token' }); }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, username) => {
        if (err) {
            res.json({ auth: false, success: false, message: 'No valide token' });
        }
        req.username = username;
        next();
    })
}

app.listen(process.env.PORT || 3003, () => console.log('up and running'));