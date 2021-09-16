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



var micBlob = false;
var micRecorder = false;

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
    if (request.micRedord && micRecorder){
      document.getElementsByClassName('ytp-play-button ytp-button')[0].click()
      console.log(request)
      if(request.micRedord==='recording start'){
        chunks = [];
        micRecorder.start(10);
      
      }
      else{
        micRecorder.stop();
        micBlob = new Blob(chunks, { 'type' : 'audio/flac' });
        var blobString = blobToBase64(micBlob);
        blobString.then((result)=>
        chrome.storage.local.set({recordedSong: result}, function() {
          sendResponse({recording:'complete'})
        })
       ).catch(()=>
       sendResponse({recording:'fail'}));
      
      } 
      
    }
    else if(request.a){
      sendResponse({url:window.location})
    }
    //마이크 장치 권한
    else if(request.getSoundStream){
      navigator.mediaDevices.getUserMedia({audio:true})
      .then(function(stream) {
          console.log(request.getSoundStream)
          stream.getTrackById(request.getSoundStream)
          console.log(stream.getAudioTracks())
          micRecorder =  new MediaRecorder(stream);
          window.chunks = [];
          micRecorder.ondataavailable = e => {
            chunks.push(e.data)
          }
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
      })
      .catch(function(err) {
          sendResponse({
            message:'mic undefined',
          })
        })
    }

    //addListner내부 함수는 return true미 반환시 미작동
    return true
})