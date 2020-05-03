const express = require('express');
const bodyParser = require('body-parser');
var app = express();
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
require('dotenv').config();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs')
const multer = require("multer");
const mongoose = require('mongoose'); //db
const Note = require('./models/Note.js');
const User = require('./models/User.js');
mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
}, () => console.log('connected')) //connect to the DB
app.locals.url = "https://hw.yaznic.me/";


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

var upload = multer({
    storage: storage
})

app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(session({
    secret: "Shh, its a secret!",
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000
    }
}));
app.use(bodyParser.json()); //USE BODYPARSER
app.set('views', __dirname + '/views'); //SET THE VIEW FOLDER
app.set('view engine', 'pug'); //SET THE VIEW ENGINE

/*
Todo: create each user page
create each note page
create login page
create signup page
*/

app.use('/create', async (req, res, next) => {
    if (req.session.token) {
        let decoded_id = jwt.verify(req.session.token, 'aa450450');
        let tempuser = await User.findById(decoded_id);
        tempuser.password = null;
        tempuser ? req.user = tempuser : req.user = null;
    } else {
        return res.status(400).json({
            "Error": "Not logged in"
        })
    }
    return next();
});

app.route('/login')
    .post(async (req, res) => {
        if (req.body.login !== "snap") {
            if (!req.body.password) {
                return res.status(400).json({
                    "error": "must provide password"
                })
            }
        }

        let temp_user_check = await User.findOne({
            "username": req.body.username
        });

        if (temp_user_check) {
            if (temp_user_check.type == "snap") {
                req.session.token = jwt.sign({
                    _id: temp_user_check._id
                }, 'aa450450')
                temp_user_check.password = null
                return res.status(201).json({
                    "user": temp_user_check.type
                });
            } else {
                let check_password = await bcrypt.compare(req.body.password, temp_user_check.password)
                if (check_password) {
                    req.session.token = jwt.sign({
                        _id: temp_user_check._id
                    }, 'aa450450')
                    temp_user_check.password = null
                    return res.status(201).json({
                        "user": temp_user_check.type
                    });
                } else {
                    return res.status(234).json({
                        "error": "incorrect password"
                    })
                }
            }
        } else {
            return res.status(420).json({
                "error": "no user with that username"
            })
        }
    });

app.route('/signup')
    .post(async (req, res) => {
        try {
            if (req.body.login !== "snap") {
                if (!req.body.password) {
                    return res.status(400).json({
                        "error": "must provide password"
                    })
                }
            }
            let checkuser = await User.findOne({
                "username": req.body.username
            });
            if (checkuser) {
                if (checkuser.type == "snap") {
                    req.session.token =
                        jwt.sign({
                            _id: checkuser._id
                        }, 'aa450450')
                    return res.status(201).json({
                        "User": checkuser,
                    });
                }
                return res.status(234).json({
                    "error": "user already exists"
                });
            }
            let temptype = req.body.login ? "snap" : undefined
            let salt = await bcrypt.genSalt(10); //generate the salt for the hash
            let temppass = req.body.password ? await bcrypt.hash(req.body.password, salt) : undefined //hash the password
            let tempdisplay_name = req.body.login == "snap" ? req.body.displayName : undefined
            let tempuser = new User({
                "username": req.body.username,
                "name": tempdisplay_name,
                "password": temppass,
                "type": temptype,
                "admin": false
            });
            let saveduser = await tempuser.save();
            saveduser.password = null;
            req.session.token = jwt.sign({
                _id: tempuser._id
            }, 'aa450450')
            res.status(201).json({
                "User": saveduser
            })
        } catch (e) {
            console.log(e);
        }
    });

app.use(async (req, res, next) => {
    if (req.session.token) {
        let decoded_id = jwt.verify(req.session.token, 'aa450450');
        let tempuser = await User.findById(decoded_id);
        tempuser.password = null;
        res.locals.user = tempuser
    }
    return next();
});

app.get('/', async (req, res) => {
    let notes = await Note.find({});
    let decodedimage = notes.image;
    notes.image = null;
    return res.render('index', {
        "notes": notes
    });
});

app.get('/logout', async (req, res) => {
    if (req.session.token)
        req.session.token = null;
    res.redirect('/');
})

app.route('/notes/:noteid')
    .get(async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.noteid)) {
            return res.json({
                "error": "not a valid id"
            })
        }
        let tempnote = await Note.findById(req.params.noteid);
        if (!tempnote)
            return res.send("note doesnt exist");
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (!tempnote.views.includes(ip)) {
            await Note.findByIdAndUpdate(req.params.noteid, {
                $push: {
                    "views": [ip]
                }
            })
        }
        return res.render("note", {
            "note": tempnote
        });
    })
    .delete(async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.noteid)) {
            return res.json({
                "error": "not a valid id"
            })
        }
        let tempnote = await Note.findById(req.params.noteid);
        if (!tempnote)
            return res.send("note doesnt exist");
        await Note.findByIdAndDelete(req.params.noteid);
        res.send("note deleted")
    });

app.route('/create/note')
    .post(upload.single("image"), async (req, res) => {
        try {
            let img = fs.readFileSync(req.file.path);
            let encode_image = Buffer.from(img)
            let see_name = req.body.showname ? true: false
            let tempnote = new Note({
                "name": req.body.name,
                "creator": {
                    "id": req.user._id,
                    "username": req.user.username,
                    "type": req.user.type,
                    "name": req.user.name,
                    "showname": see_name
                },
                "image": {
                    "buf": encode_image.toString('base64'),
                    "mime": req.file.mimetype
                }
            });
            let savednote = await tempnote.save();
            fs.unlinkSync(req.file.path);
            return res.redirect('/')
        } catch (e) {
            console.log(e);
        }
    })
    .get(async (req, res) => {
        res.sendFile(__dirname + '/public/createNote.html')
    })

app.listen(80, () => {
    if (!fs.existsSync('./uploads')) {
        fs.mkdirSync('./uploads');
    }
    console.log("Server has started on port 80");
});