'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page



var totalBlob = false;
var totalRecorder = false;

var voiceBlob = false;
var voiceRecorder = false;

var audioContext = new AudioContext();

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    //popup의 record버튼 클릭 시 메시지 교환
    if (request.micRedord && totalRecorder){

      //youtube on/off
      document.getElementsByClassName('ytp-play-button ytp-button')[0].click()
      if(request.micRedord==='recording start'){
        totalChunks = [];
        totalRecorder.start(10);
      
      }
      else{
        totalRecorder.stop();
        totalBlob = new Blob(totalChunks, { 'type' : 'audio/flac' });
        var totalBlobString = blobToBase64(totalBlob);
        totalBlobString.then((result)=>{
          chrome.storage.local.set({recordedAudio: result},()=>{
            sendResponse({recording:'success'})
          })
        }
        )
      } 
      
    }
    //마이크 장치 권한
    else if(request.getMic){
          audioContext = new AudioContext();
          navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
              console.log(devices)
              devices.forEach(function(device) {
                if((device.deviceId === 'default')&&(device.kind ==='audioinput')){
                  console.log(device.label)
                  sendResponse({
                    message: device.label,
                  });
                }
              });
            })
            .catch(function(err) {
              sendResponse({
                message:'mic undefined',
              });
            });
      
    }

    else if(request.getStream){
      navigator.mediaDevices.getUserMedia({audio:true})
      .then(function(micStream) {
          var audioStream = document.querySelectorAll('video.video-stream ')[0].captureStream()
          
          var audio_voice = audioContext.createMediaStreamSource(micStream);
          var audio_inst = audioContext.createMediaStreamSource(audioStream);

          var mixedDest = audioContext.createMediaStreamDestination();

          audio_voice.connect(mixedDest)
          audio_inst.connect(mixedDest)

          totalRecorder =  new MediaRecorder(mixedDest.stream);
          window.totalChunks = [];
          totalRecorder.ondataavailable = e => {
            totalChunks.push(e.data)
          }
    
    })
  }
    //addListner내부 함수는 return true미 반환시 미작동
    return true
})