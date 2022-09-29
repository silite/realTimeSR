import ReconnectingWebSocket from 'reconnecting-websocket';

const rws = new ReconnectingWebSocket('ws://localhost:11112', [], {
  WebSocket: window.WebSocket
})
const mainDom = document.querySelector("#main")

rws.addEventListener('open', () => {
  rws.send('init')
})

rws.addEventListener('message', (evt) => {
  const data = evt.data
  mainDom.innerHTML = data
})
