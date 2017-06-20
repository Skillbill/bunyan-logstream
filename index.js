const express = require('express');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const basicAuth = require('express-basic-auth');

const interfaceApp = express();
const logApp = express();
const users = [];
const appPort = process.env.APP_PORT || 3001;
const logPort = process.env.LOG_PORT || 3000;
const logDir = process.env.LOG_DIR || '/root/.pm2/logs';
const user = process.env.USER;

if (user) {
    let users = {};
    users[user.split('|')[0]] = user.split('|')[1];
    //console.log(users);
    interfaceApp.use(basicAuth({
        users,
        challenge: true,
        realm: 'Log'
    }));
}

interfaceApp.use(express.static('public'));
interfaceApp.use('/files', serveIndex(logDir, {'icons': true, view: 'details'}));
interfaceApp.use(bodyParser.json());
interfaceApp.use(bodyParser.urlencoded({extended: false}));
logApp.use(bodyParser.json());
logApp.use(bodyParser.urlencoded({extended: false}));


const interfaceRouter = express.Router();
const logRouter = express.Router();

interfaceApp.use('/', interfaceRouter);
logApp.use('/', logRouter);

interfaceRouter.get('/files/:filename', (req, res) => {
  res.download(`${logDir}/${req.params.filename}`);
});

interfaceRouter.get('/join', (req, res) => {

  res.writeHead(200, {
    'Connection': 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });

  var user = {
    userId: req.query.userId,
    level: 10,
    res: res
  };

  users.push(user);

  res.write("id:" + Math.random() + "\nevent: ack\ndata: \n\n");

  var keepInterval = setInterval(function() {
    res.write("id:" + Math.random() + "\nevent: keep\ndata: \n\n");
  }, 1000 * 20);

  res.on("close", function() {
    clearInterval(keepInterval);
    for (var i = users.length-1; i >= 0; i--) {
      if (users[i].res === res) {
        users.splice(i, 1);
      }
    }
  });

});

logRouter.post('/bunyan-log', (req, res) => {
  log(req.body);
  brodcast({event: 'message', data: req.body});
  res.send({});
});

interfaceRouter.post('/set-level-filter', (req, res) => {
  users.forEach((user) => {
    if(user.userId == req.query.userId) {
      user.level = req.body.level;
    }
  });
  res.send({ok: true});
});

const log = (body) => {
  if (body.level >= 50) {
    console.error(body);
  } else {
    console.log(body);
  }
};

const brodcast = function(payload) {
  users.forEach((u) => {
    if(payload.data.level >= u.level) {
      sendTo(u, payload);
    }
  });
};

var sendTo = function(user, payload) {
  if(user) {
    user.res.write("id:" + Math.random() + "\nevent: " + payload.event + "\ndata: " + JSON.stringify(payload.data) + "\n\n");
  }
};

const appListener = interfaceApp.listen(appPort, function() {
  console.log(`app listening on port ${appListener.address().port}!`);
});
const logListener = logApp.listen(logPort, function() {
    console.log(`log listening on port ${logListener.address().port}!`);
});

//for DOCKER
process.on('SIGINT', function() {
  process.exit();
});
