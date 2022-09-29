// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const ws = require('ws')

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

Menu.setApplicationMenu(null);

expressApp.use('/', express.static(path.join(__dirname, './frontend')))

let gatherSocket
function startServer() {
  const server = new ws.Server({
    port: 11112,
  });

  server.on('connection', (socket, req) => {
    console.log(socket, 'silite')
    gatherSocket = socket

    socket.on('close', () => {
      // todo
      gatherSocket?.send(JSON.stringify({ status: 'stop' }))
    })

    socket.on('error', (error) => {
      console.log('123')
      startServer()
    })
  })
}

function emitMsg(msg) {
  gatherSocket?.send(msg)
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    // width: 1024,
    // height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: './asset/favicon.ico',
    resizable: false,
  })

  ipcMain.on('sendMsg', (event, msg) => {
    emitMsg(msg)
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  expressApp.listen('11111', () => {
  })
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  startServer()

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
