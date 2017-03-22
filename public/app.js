let maxLogLine = 100;
let active = true;
let messageDuringPause = [];

const levels = {
  60: "fatal",
  50: "error",
  40: "warn",
  30: "info",
  20: "debug",
  10: "trace"
};

const App = (function() {

  var es = new EventSource('/join');
  es.addEventListener("open", open);
  es.addEventListener("error", error);
  es.addEventListener("message", message);

  const appendCell = (row, content) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = content;
    row.appendChild(cell);
  };


  function open(e) {
    console.log("open", e);
  }

  function message(e) {

    if (active) {

      const m = JSON.parse(e.data);

      console.log("log", m);

      const log = document.getElementById('log');

      while (log.childElementCount > maxLogLine) {
        log.removeChild(log.children[1]);
      }

      const row = document.createElement('div');
      row.className = 'row ' + levels[m.level];
      log.appendChild(row);


      appendCell(row, `${m.time}`);
      appendCell(row, `${m.hostname}`);
      appendCell(row, `${levels[m.level] || m.level}`);
      appendCell(row, `${m.msg}`);

      document.body.scrollTop = document.body.scrollHeight;
    } else {
      console.log('message skipped. I\'m pased');
      messageDuringPause.push(e);
    }

  }

  function error(e) {
    console.error("error", e);
  }

  return {
    pause : () => {
      active = false;
    },
    play : () => {
      active = true;
      for (let i = 0; i < messageDuringPause.length; i++) {
        message(messageDuringPause[i]);
      }
      messageDuringPause = [];
    },
    isActive : () => {
      return active;
    },
    maxLines : (lines) => {
      maxLogLine = lines;
    }
  };

})();

const pauseButton = document.querySelector('button.pause');
pauseButton.addEventListener('click', () => {
  if(App.isActive()) {
    App.pause();
    pauseButton.innerHTML = 'PLAY';
  } else {
    App.play();
    pauseButton.innerHTML = 'PAUSE';
  }
});
