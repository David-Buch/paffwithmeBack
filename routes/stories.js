const express = require('express');
require('dotenv').config();
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

let timeOuts = [];
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },

    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + Date.now());
    }
});
const upload = multer({ storage: storage })
router.use(express.json());

router.post('/upload', upload.single('storie'), (req, res) => {
    console.log(req.file);

    //deleting Stories  
    const timer = setTimeout(() => deleteFile(req.file.filename),
        24 * 60 * 60 * 1000)
    timeOuts.push(timer);

    res.send('worked');
});

router.post('/get', (req, res) => {
    //working on it next time
    const username = req.body.username;
    const directoryPath = path.join(__dirname, '../', 'uploads'); //err C:\Users\David\paffwithme\server\routes\uploads

    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function (file) {
            if (username == file.split('-')[0]) {
                var options = {
                    root: directoryPath
                };
                res.sendFile(file, options, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Sent:', file);
                    }
                });
                //res.download(filePath);
            }
            else {
                res.send({ success: false, message: 'No Storie from this User!' })
            }

        });
    });

    //send files
    function sendFiles() {
        let filePath = path.join(__dirname, "youe-file.whatever");
        res.download(filePath);
    }
});

const deleteFile = (filename) => {
    fs.unlink("./uploads/" + filename, (err => {
        if (err) throw err;
    }));
    console.log('delete');
}

module.exports = router;