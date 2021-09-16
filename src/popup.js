'use strict';

import './popup.css';
var createBuffer = require('audio-buffer-from');
var util = require('audio-buffer-utils');
//장치 연결 상태 button
const audioBtn= document.getElementById('audioBtn');
const micBtn = document.getElementById('microphoneBtn');

//연결된 장치 표시 input
const audio = document.getElementById('audio');
const mic = document.getElementById('mic');


//레코딩 버튼
const record = document.getElementById('record');
const remove =  document.getElementById('remove');

//tab audio 관련 변수


//장치 연결상태 정의
function addSoundInfo(callback){
    chrome.tabs.query({active: true,currentWindow: true}, function (tabs) {
    if (tabs[0].url.split('v=')[0]=='https://www.youtube.com/watch?'){
        chrome.tabs.sendMessage(tabs[0].id,
            {
              a: 'a'
            },function(response){
                console.log(window.location)
                document.getElementById('frame').src = response.url
                navigator.mediaDevices.getUserMedia({audio:true})
                .then(function(stream) {
                    console.log(stream)
                })
                audio.value= tabs[0].title;
                audioBtn.style.backgroundColor='aquamarine';
            })
        }
    else{
        audio.value='유튜브 영상 페이지에서 실행해주세요';
        audioBtn.style.backgroundColor='lightcoral';
    }
    callback()
  })
}

function addMicInfo(){
    chrome.tabCapture.capture({audio:true, video:false}, (stream)=>{
        var context = new AudioContext();
        context.createMediaStreamSource(stream).connect(context.destination);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id,
                {
                  getSoundStream: 'URL.createObjectURL(stream)'
                },
                function(response) {
                    console.log(response)
                    if(response.message!=='mic undefined'){
                        mic.value = response.message
                        micBtn.style.backgroundColor='aquamarine';
                    }
                    else{
                        mic.value = '연결된 마이크가 없습니다.'
                        micBtn.style.backgroundColor='lightcoral';
                    }
                    completeRecord()
                }
              )
        })
    })
}   


//장치의 연결 상태 반환
function getSound(){
    if (audioBtn.style.backgroundColor==='aquamarine'){
        return true
    }
    else{
        return false
    }

}
function getMic(){
    if (micBtn.style.backgroundColor==='aquamarine'){
        return true
    }
    else{
        return false
    }
}




//녹음상태를 정의
function onRecord(){
    document.getElementById('recordState').value = '녹음 중'
    document.getElementById('recordImg').src = '../icons/stop.svg'
}

function readyRecord(){
    document.getElementById('audioContainer').style.flexDirection = 'row';
    document.getElementById('audioContainer').style.alignItems = 'center';
    document.getElementById('audioContainer').innerHTML = `<input type="" id="recordState" value="-- : --"></input>`
    
    setTimeout(function () {
        if(getMic()&&getSound()){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if(tabs[0].audible){
                document.getElementById('record').disabled = true;
                document.getElementById('recordState').value = '정지된 영상에서 실행하세요.'
            }
            else{
                document.getElementById('record').disabled = false;
                document.getElementById('recordState').value = '녹음이 준비되었습니다.'
            }
        })
        document.getElementById('record').src = './icons/record.svg'
        }
        else{
            document.getElementById('recordState').value = '유튜브 영상과 녹음장치가 필요합니다.'
            document.getElementById('record').disabled = true;
        }
    }, 2000);
}

function completeRecord(){
    chrome.storage.local.get(['recordedSong'],(result)=>{
        if (result.recordedSong !== undefined){
            remove.disabled = false;
            record.disabled = true;
            const song = result.recordedSong;
            document.getElementById('audioContainer').style.flexDirection = 'column';
            document.getElementById('audioContainer').style.alignItems = 'start';
            document.getElementById('audioContainer').innerHTML = `<p>voice only</p><audio controls id='song' src='${song}'>이게안되네....</audio>`
            /*chrome.storage.local.get(['recordedInst'],(result)=>{
                console.log(result)
                document.getElementById('audioContainer').innerHTML += `<p>mixed</p><audio controls id='mixed' src='${mixTwoBlob(result.recordedInst, song)}' >이게안되네....</audio>`
                
        })*/
        }
        else{
            readyRecord();
            remove.disabled = true;
        }
    })
}

let recording = false;

function recordStart(){
    chunks = [];
    var context = new AudioContext();

    chrome.tabCapture.capture({audio:true, video:false}, (stream)=>{
        context.createMediaStreamSource(stream).connect(context.destination);
        tabRecorder = new MediaRecorder(stream);
        tabRecorder.ondataavailable = e => {
            chunks.push(e.data)
        }
        tabRecorder.start(100);
      })
}


function recordStop(){
    tabRecorder.stop();
    tabAudioBlob = new Blob(chunks, { 'type' : 'audio/flac' });
    var blobString = blobToBase64(tabAudioBlob);
    blobString.then((result)=>
    chrome.storage.local.set({recordedInst: result},()=>
    completeRecord())
    )
}

function playRecord(){
    if(!recording){
        recording = true;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id,
                {
                  micRedord:'recording start'
                }    
            )
        })
            onRecord();
    }

    else if(recording){
        recording = false;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id,
                {
                  micRedord:'recording stop'
                },function(response){
                    completeRecord()
                }
            )
            })
        document.getElementById('recordImg').src = './icons/record.svg'
    }
}


function deleteRecord(){
    chrome.storage.local.clear(()=> console.log('localstorage cleared'))
    window.close();

}


//음성 재생을 위한 blob to string함수
function blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

/*두 base64오디오를 믹싱
function mixTwoBlob(inst,song){
    var voice = createBuffer(song, 'uint8');
    console.log(voice)
    var instrument = createBuffer(inst, 'uint8');
    console.log(instrument)
    util.mix(voice, instrument,)
    console.log(voice);
    
    var blob = new Blob([util.mix(voice, instrument)], { type: "audio/flac" });
    var blobString = blobToBase64(blob);
    blobString.then((result)=>
    console.log(result))

}
*/

//이벤트 정의
remove.addEventListener('click', deleteRecord)
record.addEventListener('click', playRecord);
document.addEventListener('DOMContentLoaded', addSoundInfo(addMicInfo));
