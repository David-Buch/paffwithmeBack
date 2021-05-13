const express = require('express');
const router = express.Router();
const db = require('../config/UserDB');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;


router.use(cors({
    origin: ['http://10.0.0.1:3000', 'https://paffwithme.netlify.app', 'https://smokeapipe.netlify.app'],//Frontend
    methods: ['GET', 'POST'],
    credentials: true,
})
);
router.use(express.json());

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
                            //const id=result[0].id;
                            const jwtUsername = { username: result[0].username };
                            const accessToken = jwt.sign(jwtUsername, process.env.ACCESS_TOKEN_SECRET);
                            //res.json({ auth: true, successs: true, accessToken: accessToken });
                            console.log('worked');
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

module.exports = router;