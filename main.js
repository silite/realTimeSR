// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const ReconnectingWebSocket = require('reconnecting-websocket')
const ws = require('ws')
const express = require('express')
const bodyParser = require('body-parser')

const expressApp = express()

expressApp.use(bodyParser.urlencoded({ extended: false }))
expressApp.use(bodyParser.json())

expressApp.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header("Access-Control-Allow-Headers", " Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  res.header('X-Powered-By', ' 3.2.1')
  next()
})

expressApp.use('/', express.static(path.join(__dirname, './frontend')))


Menu.setApplicationMenu(null);

let gatherSocket
function startSocket() {
  gatherSocket = new ReconnectingWebSocket('ws://212.129.237.61:12345', [], {
    WebSocket: ws
  })

  gatherSocket.addEventListener('open', () => {
    gatherSocket.send(JSON.stringify({
      type: 'start'
    }))
  })

  gatherSocket.addEventListener('message', (evt) => {
    const msg = evt?.data
    global.mainWindow.webContents.send('message', msg)
    sendFrontSocket && sendFrontSocket.send(msg)
  })

  gatherSocket.addEventListener('error', () => {
    startSocket()
  })

  gatherSocket.addEventListener('close', () => {
    gatherSocket.send(JSON.stringify({
      type: 'stop'
    }))
  })
}

let sendFrontSocket
function startFrontServer() {
  const server = new ws.Server({
    port: 11112
  })

  server.on('connection', (socket, req) => {
    sendFrontSocket = socket

    socket.on('close', () => {
      gatherSocket.send(JSON.stringify({
        type: 'stop'
      }))
    })

    socket.on('error', (error) => {
      setTimeout(() => {
        startFrontServer()
      }, 500)
    })
  })
}

function emitAudio(audio) {
  gatherSocket?.send(audio)
}

function createWindow() {
  // Create the browser window.
  global.mainWindow = new BrowserWindow({
    height: 0,
    width: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: './asset/favicon.ico',
    resizable: false,
  })

  ipcMain.on('sendAudio', (event, audio) => {
    emitAudio(audio)
  })

  // and load the index.html of the app.
  global.mainWindow.loadFile('index.html')

  // Open the DevTools.
  // global.mainWindow.webContents.openDevTools()

  expressApp.listen('11111', () => {
  })
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  startFrontServer()
  startSocket()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
