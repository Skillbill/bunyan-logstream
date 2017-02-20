const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const users = [];
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const router = express.Router();
app.use('/', router);

router.get('/join', (req, res) => {

  res.writeHead(200, {
    'Connection': 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });

  var user = {
    res: res
  };

  users.push(user);

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

  console.log('log received', req.body);

  const body = req.body;
  const bodyMesage = JSON.parse( body.message );

  brodcast({event: 'message', data: {
    timestamp : bodyMesage['@timestamp'],
    text : bodyMesage.message,
    source : bodyMesage.source,
    level : bodyMesage.level,
    logname : bodyMesage.name,
    hostname : bodyMesage.hostname,
    host : body.host
  }});
  res.send({});
});

const brodcast = function(payload) {
  console.log('broadcasting', JSON.stringify(payload));
  users.forEach((u) => {
    sendTo(u, payload);
  });
};

var sendTo = function(user, payload) {
  console.log('sending to', JSON.stringify(payload));
  if(user) {
    user.res.write("id:" + Math.random() + "\nevent: " + payload.event + "\ndata: " + JSON.stringify(payload.data) + "\n\n");
  }
};

const listener = app.listen(port, function() {
  console.log(`app listening on port ${listener.address().port}`);
});

//for DOCKER
process.on('SIGINT', function() {
  process.exit();
});
