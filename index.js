const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bodyParser = require('body-parser');
const axios = require('axios');
const { fetch: undiciFetch } = require("undici");
const twvoucher = require('@fortune-inc/tw-voucher');
const DiscordStrategy = require('passport-discord').Strategy;
const cors = require("cors")
const request = require("request");


const db = require('./db');
const db2 = require('./db2')

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('express-session')({ secret: '.', resave: true, saveUninitialized: true }));


const GOOGLE_CLIENT_ID = '.';
const GOOGLE_CLIENT_SECRET = '.';




app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/public/style.css', (req, res) => {
  res.type('text/css');
  res.sendFile(__dirname + '/public/style.css');
});

app.get('/public/fd.css', (req, res) => {
  res.type('text/css');
  res.sendFile(__dirname + '/public/fd.css');
});

app.get('/public/emoji.css', (req, res) => {
  res.type('text/css');
  res.sendFile(__dirname + '/public/emoji.css');
});

app.get('/public/h1.css', (req, res) => {
  res.type('text/css');
  res.sendFile(__dirname + '/public/h1.css');
});

app.get('/to/OIP.jpg', (req, res) => {
  res.type('img');
  res.sendFile(__dirname + '/to/OIP.jpg');
});

app.get('/to/discord.png', (req, res) => {
  res.type('img');
  res.sendFile(__dirname + '/to/discord.png');
});

app.get('/to/email.jpg', (req, res) => {
  res.type('img');
  res.sendFile(__dirname + '/to/email.jpg');
});

app.get('/public/topup.css', (req, res) => {
  res.type('text/css');
  res.sendFile(__dirname + '/public/topup.css');
});

app.get('/public/h.css', (req, res) => {
  res.type('text/css');
  res.sendFile(__dirname + '/public/h.css');
});

app.get('/g', (req, res) => {
  res.render('g', { user: req.user });
});

app.get('/login', (req, res) => {
  res.render('login', { error: '' });
});

app.get('/topup', (req, res) => {
  res.render('topup', { error: '' });
});

app.get('/h', (req, res) => {
  res.render('h', { user: req.user });
});

app.get('/term-of-service', (req, res) => {
  res.render('gf', { user: req.user });
});

app.get('/privacy-policy', (req, res) => {
  res.render('fg', { user: req.user });
});

app.get('/api', (req, res) => {
  res.render('api', { error: '' });
});


app.get('/', (req, res) => {
  const selectQuery = 'SELECT SUM(amount) AS total FROM topup_history';
  db.query(selectQuery, (err, result) => {
    if (err) {
      console.error('Error fetching data: ' + err);
      res.status(404).send('404เกินข้อผิดพลาดที่mysql ได้โปรดติดต่อเจ้าของเว็บผ่าน อีเมล์พร้อมลักฐาน email kungkmg191@gmail.com');
    } else {
      const totalAmount = result[0].total || 0;
      res.render('index', { totalAmount });
    }
  });
});

app.use(session({
  secret: 'kungor191234567',
  resave: true,
  saveUninitialized: true
}));


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.render('login', { error: 'Please enter both username and password' });
    return;
  }
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const user = results[0];

      bcrypt.compare(password, user.password, (err, result) => {
        if (err) throw err;

        if (result) {
          req.session.user = user;
          res.redirect('/');
        } else {
          res.render('login', { error: 'Incorrect password' });
        }
      });
    } else {
      res.render('login', { error: 'User not found' });
    }
  });
});

passport.use(new DiscordStrategy({
  clientID: '.',
  clientSecret: '.',
  callbackURL: 'http://localhost:3000/callback',
  scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.get('/login/discord', passport.authenticate('discord'));
app.get('/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);


app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    res.redirect('/');
  });
});

app.get('/register', (req, res) => {
  res.render('register', { error: '' });
});

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    res.render('register', { error: 'Please fill in all fields' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], (err, result) => {
    if (err) {
      res.render('register', { error: 'Username or email already exists' });
      return;
    }

    res.redirect('/login');
  });
});







passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/google/callback',
  scope: ['profile', 'email']
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);



app.get('/profile', (req, res) => {
  console.log(req.user)
  if (req.isAuthenticated()) {
    const user = req.user;
    res.render('profile', { user });
  } else if (req.session.user) {
    const user = req.session.user;
    res.render('profile', { user });
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});





let tls = require("tls");
tls.DEFAULT_MIN_VERSION = "TLSv1.3";


const { fetch } = require("undici");
const { JSONCookie } = require('cookie-parser');


app.post('/topup', async(req, res) => {

  const body = req.body;
  let phoneNumber = body.phoneNumber;
  let voucherCode = body.voucherCode;

  console.log(body)

  TrueWalletApi(phoneNumber, voucherCode, (err, resApi) => {
    if(err) {
      res.sendStatus(404);
      console.log('err')
    }else{
      console.log(resApi)
      if(resApi.status.code == ""){
        res.sendStatus(200);
        console.log('ok')
        return {
          amount: Number(data.data.my_ticket.amount_baht.replace(/,/g, '')),
          owner_full_name: data.data.owner_profile.full_name,
          code: voucherCode
        };
      }else{
        console.log(resApi)
      }
    }
  })
  
});


/**
     * @typedef {Object} Voucher
     * @property {Number} voucher_id
     * @property {String} amount_baht
     * @property {String} redeemed_amount_baht
     * @property {Number} member
     * @property {String} status
     * @property {String} link
     * @property {String} detail
     * @property {Number} expire_date
     * @property {Number} redeemed
     * @property {Number} available
     */

    /**
     * @typedef {Object} ApiResponse
     * @property {Object} status
     * @property {String} status.message
     * @property {"VOUCHER_NOT_FOUND" | "VOUCHER_OUT_OF_STOCK" | "VOUCHER_EXPIRED" | "SUCCESS"} status.code
     * @property {Object} data
     * @property {Voucher} data.voucher
     */

    /**
     * @callback trueWalletApiCallback
     * @param {Error} err
     * @param {ApiResponse} res
     */

    /**
     * @param {Number} phone 
     * @param {String} url 
     * @param {trueWalletApiCallback} callback
     */

    function TrueWalletApi(phone, url, callback) {
      if (!url || !phone) return callback(null, "NOT_FOUND_URL_OR_PHONE");
      if(!url.includes("https://gift.truemoney.com/campaign/?v=")) return callback(null, "INVALID_URL");
      var options = {
              'method': 'POST',
              'url': `https://gift.truemoney.com/campaign/vouchers/${url.split("?v=")[1]}/redeem`,
              'headers': {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'aaaaaaaaaaa'
          },
          body: JSON.stringify({
              "mobile": phone,
              "voucher_hash": url.split("?v=")[1]
          })
      
      };
      request(options, function (error, response) {
          if (error){
              callback(error, null)
          }else{
              callback(null, JSON.parse(response.body))
          }
      });
  }

app.get('/api/data', (req, res) => {
  const data = { message: 'หน้านี่เหงานะเลยเขี่ยนเล่น5555' };
  res.json(data);
});



const ip = '192.168.1.4'
const host = '0.0.0.0';
const port = 3000;
const url = 'http://localhost:3000'
app.listen(port, () => {
  console.log(`Server is running on ${host}:${port}`, url, ip);
});
