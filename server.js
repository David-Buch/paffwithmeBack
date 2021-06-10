require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const notification = require('./routes/notification');
const user = require('./routes/user');
const smokingData = require('./routes/smokingData');
const favicon = require('serve-favicon');

//const session = require("express-session");
//const cookieParser = require("cookie-parser");

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
//app.use(cookieParser());
/*app.use(session({
name: 'userId',
    secret: process.env.COOKIE_SECRET,
        resave: false,
            saveUninitialized: false,
                cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
            secure: true,
                sameSite: 'none',
    }
}));
*/

app.use('/notification', notification);
app.use('/user', user);
app.use('/smokingData', smokingData);


app.listen(process.env.PORT || 3003, () => console.log('up and running'));