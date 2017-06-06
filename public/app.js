const userId = parseInt((Math.random() + "").split('.')[1], 10).toString(16);

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

  var es = new EventSource('/join?userId=' + userId);
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
    init();
    document.body.classList.remove('loading');
  }

  const logContainer = document.getElementById('log');

  function message(e) {

    if (active) {

      const m = JSON.parse(e.data);

      console.log("log", m);

      while (logContainer.childElementCount >= maxLogLine) {
        logContainer.removeChild(logContainer.children[0]);
      }

      const row = document.createElement('div');
      row.className = 'row ' + levels[m.level];
      
      appendCell(row, `${m.time}`);
      appendCell(row, `${m.hostname}`);
      appendCell(row, `${levels[m.level] || m.level}`);
      appendCell(row, `${m.msg}`);
      
      logContainer.appendChild(row);

      document.body.scrollTop = document.body.scrollHeight;
    } else {
      console.log('message skipped. I\'m paused');
      if(messageDuringPause.length >= maxLogLine) {
        messageDuringPause.shift();
      }
      messageDuringPause.push(e);
    }

  }

  function error(e) {
    console.error("error", e);
  }
  
  function setLevelFilter(val) {
    if(val in levels) {
      let newVal = parseInt(val, 10);
      if(levelFilter != newVal) {
        levelFilter = newVal;
        console.log("levelFilter", levelFilter);
        fetch('/set-level-filter?userId=' + userId, {
          method:'post',
          credentials: 'include',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            level: levelFilter
          })
        })
      }
    } else {
      console.error("levelFilter not valid", val);
    }
  };

  function init() {
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
      if(location.hash.substr(1) == levels[level]) {
        filter.setAttribute('selected', 'selected');
        setLevelFilter(level);
      }
      selectFilter.appendChild(filter);
    }
    if(!location.hash) {
      setLevelFilter(10);
    }

    selectFilter.addEventListener('change', (e) => {
      setLevelFilter(selectFilter.options[selectFilter.selectedIndex].value);
      if(!location.hash || location.hash.substr(1) != levels[levelFilter]) {
        location.hash = levels[levelFilter];
      }
    });
    
    window.addEventListener('hashchange', (e) => {
      for(let level in levels) {
        if(location.hash.substr(1) == levels[level]) {
          setLevelFilter(level);
        }
      }
      selectFilter.options[selectFilter.selectedIndex].selected = false
      selectFilter.options[(levelFilter / 10) - 1].selected = true;
    })
    
    const filesButton = document.querySelector('button.files');
    filesButton.addEventListener('click', () => {
      window.open('/files');
    });
    
    const clearButton = document.querySelector('button.clear');
    clearButton.addEventListener('click', () => {
      Array.from(logContainer.querySelectorAll('.row:not(.header)')).forEach((e) => {
        logContainer.removeChild(e);
      });
    });
    
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