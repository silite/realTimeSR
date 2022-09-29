/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
let startFlag = false
// https://cloud.tencent.com/document/product/1093/48982#sdk
window.config = {
  
}
const signCallback = () => { }
const params = {
  signCallback: (signStr) => {
    function toUint8Array(wordArray) {
      // Shortcuts
      const words = wordArray.words;
      const sigBytes = wordArray.sigBytes;

      // Convert
      const u8 = new Uint8Array(sigBytes);
      for (let i = 0; i < sigBytes; i++) {
        u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      }
      return u8;
    }

    function Uint8ArrayToString(fileData) {
      let dataString = '';
      for (let i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
      }
      return dataString;
    }
    const secretKey = config.secretKey;
    const hash = window.CryptoJSTest.HmacSHA1(signStr, secretKey);
    const bytes = Uint8ArrayToString(toUint8Array(hash));
    return window.btoa(bytes);
  }, // 鉴权函数 用户提供鉴权函数，不传则为null
  // 用户参数
  secretid: config.secretId,
  appid: config.appId,
  // 实时识别接口参数
  engine_model_type: '16k_zh', // 引擎
  voice_format: 1,
  needvad: 1,
  convert_num_mode: 1,
  filter_punc: 1,
  word_info: 0,
}

window.onload = () => {
  const recorder = new WebRecorder()
  const speechRecognizer = new SpeechRecognizer(params)

  // 开始识别(此时连接已经建立)
  speechRecognizer.OnRecognitionStart = (res) => {
    console.log('开始识别', res)
    startFlag = true
  }
  // 一句话开始
  speechRecognizer.OnSentenceBegin = (res) => {
    console.log('一句话开始', res)
  }

  function splitLrc(str) {
    if ((str || '').length > 50) {
      const splitList = str.split('，')
      splitList.shift()
      return splitLrc(splitList.join('，'))
    } else {
      return str
    }
  }

  // 识别变化时
  speechRecognizer.OnRecognitionResultChange = (res) => {
    const lrc = res?.result?.voice_text_str
    const reduceRes = splitLrc(lrc)
    window.electronAPI.sendMsg(reduceRes)
    console.log(reduceRes)
  }
  // 一句话结束
  speechRecognizer.OnSentenceEnd = (res) => {
    const lrc = res?.result?.voice_text_str
    const reduceRes = splitLrc(lrc)
    window.electronAPI.sendMsg(reduceRes)
    console.log(reduceRes)
  }
  // 识别结束
  speechRecognizer.OnRecognitionComplete = (res) => {
    console.log('识别结束', res)
  }
  // 识别错误
  speechRecognizer.OnError = (res) => {
    console.log('识别失败', res)
  }

  // 建立websocket连接
  speechRecognizer.start()

  // 断开连接
  // if (连接已经建立...) {
      // speechRecognizer.stop()
  // }

  // 获取采集到的音频数据
  recorder.OnReceivedData = (data) => {
    if (startFlag) { //  可以开始识别了 此处需要判断是否建立连接成功，可在 OnRecognitionStart 回调中加标识判断
      // 发送数据 (此过程应该是一个连续的过程)
      speechRecognizer.write(data)
    }
  }
  // 采集音频出错
  recorder.OnError = (err) => {
    console.log(err)
    setTimeout(() => {
      recorder.start()
    }, 200)
  }

  // 开始录音
  recorder.start()
}
