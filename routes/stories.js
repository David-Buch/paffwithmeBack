const express = require('express');
require('dotenv').config();
const router = express.Router();
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },

    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({ storage: storage })

router.use(express.json());

router.post('/upload', upload.single('storie'), (req, res) => {
    const { filename: image } = req.file;
    const username = req.body.name;

    res.send('worked');
});

module.exports = router;