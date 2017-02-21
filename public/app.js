let maxLogLine = 100;
let active = true;
let messageDuringPause = [];

App = (function() {

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

      const log = document.getElementById('log');

      while (log.childElementCount > maxLogLine) {
        log.removeChild(log.children[1]);
      }

      const row = document.createElement('div');
      row.className = 'row';
      log.appendChild(row);


      appendCell(row, `${m.timestamp}`);
      //appendCell(row, `${m.hostname}`);
      appendCell(row, `${m.host}`);
      //appendCell(row, `${m.source}`);
      //appendCell(row, `${m.logname}`);
      appendCell(row, `${m.level}`);
      appendCell(row, `${m.body}`);//appendCell(row, `${m.text}`);

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
}
  ;

})();
