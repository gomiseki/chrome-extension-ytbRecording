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


//장치 연결상태 정의
function addSoundInfo(){
    chrome.tabs.query({active: true,currentWindow: true}, function (tabs) {
    if (tabs[0].url.split('v=')[0]=='https://www.youtube.com/watch?'){
            chrome.tabs.sendMessage(tabs[0].id,
                {
                    getStream: 'fdf'
                })
        audio.value= tabs[0].title;
        audioBtn.style.backgroundColor='aquamarine';
    }
    else{
        audio.value='유튜브 영상 페이지에서 실행해주세요';
        audioBtn.style.backgroundColor='lightcoral';
    }
    completeRecord()
  })
}

function addMicInfo(callback){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id,
            {
                getMic:'mic'
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
                callback()
                
            }
            )
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
    }, 1000);
}

function completeRecord(){
    chrome.storage.local.get(['recordedAudio'],(result)=>{
        if (result.recordedAudio !== undefined){
            console.log(result.recordedAudio)
            remove.disabled = false;
            record.disabled = true;
            document.getElementById('audioContainer').innerHTML = `<p>mixed audio</p><audio controls id='song' src='${result.recordedAudio}'>이게안되네....</audio>`
        }
        else{
            readyRecord();
            remove.disabled = true;
        }
    })
}

let recording = false;

function playRecord(){
    if(!recording){
        recording = true;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            setTimeout(function(){
                chrome.tabs.sendMessage(tabs[0].id,
                    {
                      micRedord:'recording start'
                    }    
                )
                onRecord();
            },100)
        })
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
document.addEventListener('DOMContentLoaded', addMicInfo(addSoundInfo));
