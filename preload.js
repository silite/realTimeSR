/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 * 
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require('electron')

let backupMsg = ''

contextBridge.exposeInMainWorld('electronAPI', {
  sendMsg: (msg = "") => {
    let res = msg
    if (msg.length) backupMsg = res
    else res = backupMsg
    document.querySelector('#main').innerHTML = res
    ipcRenderer.send('sendMsg', res)
  }
})
window.addEventListener('DOMContentLoaded', () => {
})
