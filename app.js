var express = require("express");
const cors = require('cors');
const https = require('https');
const jwtService = require('./jwt');
const mockDB = require('./data.mock');
const auth = require('./tokenChecker');

var app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(3000, function (err) {
  if (err) console.log(err);
  console.log("Server running on port 3000");
});

app.post('/login', function (req, res) {
  // Add tokens to request’s response 
  const username = req.body.username;
  const password = req.body.password;

  const user = mockDB.users.find(x => x.username === username && x.password === password);

  if (!user) {
    return res.status(400).send({
      message: 'Username or password is incorrect'
    });
  }
  else {
    const payload = {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username
    };
    const token = jwtService.getAccessToken(payload);
    user.token = token;
    const refreshToken = jwtService.getRefreshToken(payload);
    res.send({
      user,
      token,
      refreshToken
    });
  }
});

app.post('/register', function (req, res) {
  // Add tokens to request’s response 
  const username = req.body.username;
  const password = req.body.password;
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;

  return res.status(200).send({
    message: 'Registed Successfully'
  });
});

app.post('/refresh-token', function (req, res) {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return res.status(403).send('Access is forbidden');
  }
  try {
    const newTokens = jwtService.refreshToken(refreshToken, res); res.send(newTokens);
  } catch (err) {
    const message = (err && err.message) || err;
    res.status(403).send(message);
  }
});

app.post("/stories", auth, (req, res, next) => {

  const category = req.body.category;

  https.get('https://api.nytimes.com/svc/topstories/v2/' + category + '.json?api-key=EN80oG0AtveNRDditliwecRr9ZGm4HfA',
    (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        res.json(data);
      });
    });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});

app.post("/search", auth, (req, res, next) => {

  const search = req.body.search;
  const sort = req.body.sort;

  https.get('https://api.nytimes.com/svc/search/v2/articlesearch.json?api-key=EN80oG0AtveNRDditliwecRr9ZGm4HfA&q=' + search + '&sort=' + sort + '',
    (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        res.json(data);
      });
    });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});

app.get("/comments", auth, (req, res, next) => {
  https.get('https://api.nytimes.com/svc/community/v2/product.json?api-key=EN80oG0AtveNRDditliwecRr9ZGm4HfA&item-type=${newstype}',
    (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        res.json(data);
      });
    });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
