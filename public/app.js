let maxLogLine = 100;
let active = true;
let messageDuringPause = [];
let levelFilter = null;

const levels = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal"
};

const App = (function() {

  var es = new EventSource('/join');
  es.addEventListener("open", open);
  es.addEventListener("error", error);
  es.addEventListener("message", message);

  const appendCell = (row, content) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const cellContent = document.createElement('div');
    cellContent.textContent = content;
    cell.appendChild(cellContent);
    row.appendChild(cell);
  };


  function open(e) {
    console.log("open", e);
  }

  function message(e) {

    if (active) {

      const m = JSON.parse(e.data);

      console.log("log", m);

      if(levelFilter && m.level < levelFilter) {
        return;
      }

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
      if(messageDuringPause.length >= maxLogLine) {
        messageDuringPause.shift();
      }
      messageDuringPause.push(e);
    }

  }

  function error(e) {
    console.error("error", e);
  }

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

  const selectFilter = document.querySelector('select.logtype');
  for(let level in levels) {
    var filter = document.createElement('option');
    filter.innerHTML = levels[level];
    filter.setAttribute('value', level);
    selectFilter.appendChild(filter);
  }

  selectFilter.addEventListener('change', (e) => {
    levelFilter = selectFilter.options[selectFilter.selectedIndex].value || null;
    console.log("levelFilter", levelFilter);
  });

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