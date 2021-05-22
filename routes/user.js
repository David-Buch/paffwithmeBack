const express = require('express');
require('dotenv').config();
const router = express.Router();
const db = require('../config/UserDB');

const session = require("express-session");
const cookieParser = require("cookie-parser");

const bcrypt = require('bcrypt');
const saltRounds = 10;

// instead of body parser
router.use(express.json());
router.use(session({
    name: 'userId',
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
}));
router.use(cookieParser());



router.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    username.toLowerCase();

    db.query("SELECT * FROM userdata WHERE username=? LIMIT 1",
        [username], (err, result) => {
            if (err) { res.send({ error: err, success: false }); }
            else {
                if (result.length > 0) {
                    console.log('User Exists');
                    res.send({ message: 'User already Exists!', success: false })
                }
                else {
                    bcrypt.hash(password, saltRounds, (err, hash) => {
                        if (err) { res.send({ error: err, success: false }); }
                        else {
                            db.query("INSERT INTO userdata (username,password) VALUES (?,?)",
                                [username, hash], (err, result) => {
                                    if (err) { res.send({ error: err, success: false }); }
                                    else {
                                        console.log('Success');
                                        res.send({ success: true });
                                    }
                                });
                        }
                    })
                }
            }
        });
});

router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    username.toLowerCase();
    db.query("SELECT * FROM userdata WHERE username=? LIMIT 1",
        [username], (err, result) => {
            if (err) { res.send({ error: err, success: false }); }
            else {
                if (result.length > 0) {
                    bcrypt.compare(password, result[0].password, (error, response) => {
                        if (response) {
                            req.session.user = result[0].username;
                            res.send({ username: result[0].username, success: true });
                        }
                        else {
                            console.log('not worked1');
                            res.send({ message: "Wrong Username/Password combination", success: false });
                        }
                    })
                }
                else {
                    console.log('not worked1');
                    res.send({ message: 'User doesnt exist', success: false });
                }
            }
        });
});

router.get('/login', (req, res) => {
    if (req.session.user) {
        res.send({ success: true, username: req.session.user })
    }
    else {
        res.send({ success: false, massage: 'User not logged in!' })
    }
});


module.exports = router;