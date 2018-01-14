const apps = {
  socketio() {
    const socket = io({
      transports: [ 'websocket' ]
    });
    
    return feathers().configure(feathers.socketio(socket));
  },

  rest() {
    const rest = feathers.rest();
    
    return feathers().configure(rest.fetch(window.fetch));
  }
};

async function makeRequests (type = 'rest', times = 1) {
  const app = apps[type]();
  const promises = [];

  for (let i = 0; i < times; i++) {
    promises.push(app.service('messages').create({
      text: `makeRequests * ${times} call`
    }));
  }

  return Promise.all(promises);
}

async function benchmarkAverage (callback, times = 10) {
  let sum = 0;

  for (let i = 0; i < times; i++) {
    const start = new Date().getTime();

    await callback();

    sum += new Date().getTime() - start;
  }
  
  return sum / times;
}

async function runTimed (type = 'rest', time = 10000) {
  const app = apps[type]();

  let running = true;
  let counter = 0;

  setTimeout(() => (running = false), time);

  while (running) {
    await app.service('messages').create({
      text: `runTimed ${time}ms call`
    });

    counter++;
  }

  return counter;
}

const setStatus = message => {
  document.getElementById('status').innerHTML = message;
};

document.addEventListener('click', async ev => {
  const { target } = ev;
  const { request, type } = target.dataset;
  
  if(request === 'count') {
    setStatus('Running request count benchmark...');

    const counter = parseInt(document.getElementById('request-count').value, 10);
    const average = await benchmarkAverage(() => makeRequests(type, counter));

    setStatus(`Making ${counter} request(s) took an average of ${average}ms`);
  }

  if(request === 'timed') {
    setStatus('Running timed request benchmark...');

    const time = parseInt(document.getElementById('request-timer').value, 10) * 1000;
    const counter = await runTimed(type, time);

    setStatus(`Made ${counter} requests withing ${time / 1000} seconds`);
  }
});