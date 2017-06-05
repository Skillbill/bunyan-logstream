const express = require('express');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');

const app = express();
const users = [];
const port = process.env.PORT || 3000;
const logDir = process.env.LOG_DIR || '/root/.pm2/logs';

app.use(express.static('public'));
app.use('/files', serveIndex(logDir, {'icons': true, view: 'details'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const router = express.Router();
app.use('/', router);

router.get('/files/:filename', (req, res) => {
  res.download(`${logDir}/${req.params.filename}`);
});

router.get('/join', (req, res) => {

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

router.post('/bunyan-log', (req, res) => {
  log(req.body);
  brodcast({event: 'message', data: req.body});
  res.send({});
});

router.post('/set-level-filter', (req, res) => {
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
}

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

const listener = app.listen(port, function() {
  console.log(`app listening on port ${listener.address().port}!`); 
});

//for DOCKER
process.on('SIGINT', function() {
  process.exit();
});
