require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const notification = require('./routes/notification');
const user = require('./routes/user');
const favicon = require('serve-favicon');

const app = express();
app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use('/notification', notification);
app.use('/user', user);

app.use(express.json());

app.use(cors({
    origin: ['http://10.0.0.1:3000', 'https://paffwithme.netlify.app', 'https://smokeapipe.netlify.app'],//Frontend
    methods: ['GET', 'POST'],
    credentials: true,
})
);


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