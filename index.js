const express = require('express');
const bodyParser = require('body-parser');
var app = express();
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); //db
const Note = require('./models/Note.js');
const User = require('./models/User.js');
mongoose.connect('mongodb+srv://zaid:aa450450@cluster0-kplab.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useFindAndModify: false
}, () => console.log('connected')) //connect to the DB

app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(session({
    secret: "Shh, its a secret!"
}));
app.use(bodyParser.json()); //USE BODYPARSER
app.set('views', __dirname + '\\views'); //SET THE VIEW FOLDER
app.set('view engine', 'pug'); //SET THE VIEW ENGINE
app.use(async (req, res, next) => {
    return next();
});

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
        return res.json({
            "Error": "Not logged in"
        })
    }
    return next();
});

app.route('/login')
    .post(async (req, res) => {
        let tempuser = await User.findOne({
            "username": req.body.username
        });
        if (!tempuser) {
            res.json({
                "error": "Incorrect Email"
            });
        }
        if (tempuser.type !== "snap") {
            let correct_password = await bcrypt.compare(req.body.password, tempuser.password)
            if (correct_password) {
                req.session.token = jwt.sign({
                    _id: tempuser._id
                }, 'aa450450')
                return res.json({
                    "response": "logged in"
                })

            } else {
                return res.json({
                    "error": "incorrect password"
                })
            }
        } else {
            return res.json({
                "User": tempuser
            })
        }

    });

app.route('/signup')
    .post(async (req, res) => {
        try {
            if (req.body.login !== "snap") {
                if (!req.body.password) {
                    return res.json({
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
                        _id: tempuser._id
                    }, 'aa450450')
                    return res.json({
                        "User": checkuser,
                    });
                }
                return res.json({
                    "error": "user already exists"
                });
            }
            let temptype = req.body.login ? "snap" : undefined
            let salt = await bcrypt.genSalt(10); //generate the salt for the hash
            let temppass = req.body.password ? await bcrypt.hash(req.body.password, salt) : undefined //hash the password
            let tempuser = new User({
                "username": req.body.username,
                "date": undefined,
                "password": temppass,
                "type": temptype
            });
            let saveduser = await tempuser.save();
            console.log(saveduser)
            saveduser.password = null;
            req.session.token = jwt.sign({
                    _id: tempuser._id
                }, 'aa450450')
            res.json({
                "User": saveduser,
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
        res.locals.token = tempuser
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



app.route('/create/note')
    .post(async (req, res) => {
        try {
            let tempnote = new Note({
                "name": req.body.name,
                "creator": {
                    "id": req.user._id,
                    "username": req.user.username
                },
                "date": null,
                "image": null
            });
            let savednote = await tempnote.save();
            return res.json({
                "Note": savednote
            });
        } catch (e) {
            console.log(e);
        }
    });

app.listen(80, () => {
    console.log("Server started");
});