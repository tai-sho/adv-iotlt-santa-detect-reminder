const { exec, spawn } = require('child_process')

const IMAGE_FILE_PATH = './captured.jpg'
const AUDIO_FILE_PATH = './output.mp3'
const DETECTION_ENTITY_ID = '/m/027g6wt'
const SPEECH_MESSAGE = 'プレゼントは忘れずそこに置いていってください。'

const webcam = capture()
webcam.on('close', code => {
  if(code === 0) {
    labelDetection()
  }
})

function capture() {
  return spawn('fswebcam', ['-D', '2', '-r', '1280x720', IMAGE_FILE_PATH])
}

function labelDetection() {
  const vision = require('@google-cloud/vision')
  const client = new vision.ImageAnnotatorClient();
  client
    .labelDetection(IMAGE_FILE_PATH)
    .then(results => {
      const labels = results[0].labelAnnotations;
      console.log(labels)
      labels.some(label => {
        if(label.mid === DETECTION_ENTITY_ID) {
          textToSpeech(label.description)
          return true
        }
      })
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}

function textToSpeech(text) {
  const fs = require('fs');
  const textToSpeech = require('@google-cloud/text-to-speech');
  const client = new textToSpeech.TextToSpeechClient();
   
  const request = {
    input: {text: text},
    voice: {
      languageCode: 'ja-JP',
      name: 'ja-JP-Standard-A'
    },
    audioConfig: {audioEncoding: 'MP3'},
  };
   
  client.synthesizeSpeech(request, (err, response) => {
    if (err) {
      console.error('ERROR:', err);
      return;
    }
   
    fs.writeFile(AUDIO_FILE_PATH, response.audioContent, 'binary', err => {
      if (err) {
        console.error('ERROR:', err);
        return;
      } 
      console.log('Audio content written to file: ' + AUDIO_FILE_PATH);
      playAudio()
    });
  });

}

function playAudio() {
  const player = require('play-sound')();
  
  player.play(AUDIO_FILE_PATH, err => {
      if (err) {
        console.error('ERROR:', err);
      }
  });
}
