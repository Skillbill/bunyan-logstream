const maxLogLine = 100;

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
  };

  function message(e) {

    const m = JSON.parse(e.data);

    const log = document.getElementById('log');

    if (log.childElementCount > maxLogLine) {
      log.removeChild(log.children[1]);
    }

    const row = document.createElement('div');
    row.className = 'row';
    log.appendChild(row);


    appendCell(row, `${m.timestamp}`);
    appendCell(row, `${m.hostname}`);
    appendCell(row, `${m.host}`);
    appendCell(row, `${m.source}`);
    appendCell(row, `${m.logname}`);
    appendCell(row, `${m.level}`);
    appendCell(row, `${m.text}`);

    document.body.scrollTop = document.body.scrollHeight;

  };

  function error(e) {
    console.error("error", e);
  };

})();
