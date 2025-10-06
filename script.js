$(document).ready(function () {
    const $level = $('.level');
    const $warning = $('.warning');
    const THRESHOLD_DB = -7; // Threshold for loud sound
    let speaking = false; // flag to avoid repeated speech
    //const voices = window.speechSynthesis.getVoices();
    //const selectedVoice = voices.find(voice => voice.name === "Google US English");
    checkNoiseSuppression();


    async function startAudioMonitoring() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 2048;
        const dataArray = new Uint8Array(analyser.fftSize);

        function getDecibels() {
            analyser.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const normalized = (dataArray[i] - 128) / 128;
                sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            return 20 * Math.log10(rms + 1e-6);
        }

        setInterval(() => {
            const db = getDecibels();
            const width = Math.min(Math.max((db + 50) * 5, 0), 100);
            $level.css('width', width + '%');

            $('.decibel').text(db);

            if (db > THRESHOLD_DB) {
                $level.css('background', '#f44336');
                $warning.text('⚠️ Loud');

                if (!speaking) {
                    speaking = true;
                    const msg = new SpeechSynthesisUtterance("Lower your volume!");
                    msg.onend = () => { speaking = false; };
                    //msg.voice = selectedVoice;  // set the chosen voice
                    //msg.pitch = 2;       // max pitch
                    msg.volume = 1;      // full volume
                    window.speechSynthesis.speak(msg);
                }
            } else {
                $level.css('background', '#4caf50');
                $warning.text('Normal');
                speaking = false; // reset flag when below threshold
            }
        }, 100);






    }



    async function checkNoiseSuppression() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { noiseSuppression: true }
            });

            const track = stream.getAudioTracks()[0];
            const settings = track.getSettings();

            //console.log("Track settings:", settings);
            //$('.settings').text(JSON.stringify(settings, null, 2)); 
            $('.settings').html('<pre>' + JSON.stringify(settings, null, 2) + '</pre>');

            if (settings.noiseSuppression !== undefined) {
                console.log("Device supports noise suppression:", settings.noiseSuppression);
            } else {
                console.log("Noise suppression info not available");
            }

            // Stop the track
            track.stop();
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    }

    $('#startBtn').on('click', () => {
        startAudioMonitoring().catch(console.error);
        //$('#startBtn').prop('disabled', true); // disable button after starting
        $('#startBtn').hide();
    });

});







