$(function () {
    const $level = $('.level');
    const $warning = $('.warning');
    const thresholdForNose = -7; // threshold for loud sound
    let speaking = false; // to avoid repeated speech

    async function startAudioMonitoring() {

        //request access to the user's microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        //realtime audio is been captured, converted to stream, analyzer inspects the audio stream, and does the reading
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 2048;
        const dataArray = new Uint8Array(analyser.fftSize);


        //evaluate decibel of current sound
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

        setInterval(() => {//evalute realtime sound at short intervals
            const db = getDecibels();
            const width = Math.min(Math.max((db + 50) * 5, 0), 100);
            $level.css('width', width + '%');

            if (db > thresholdForNose) {// if the above threshold, marked as noise
                $level.css('background', '#f44336');
                $warning.text('⚠️ Noise');

                if (!speaking) {// if already speaking, wont be interrupted
                    speaking = true;
                    // const msg = new SpeechSynthesisUtterance("Keep it low!");
                    // msg.onend = () => { speaking = false; };
                    // //msg.volume = 1;      // full volume
                    // window.speechSynthesis.speak(msg);

                    const speechSynth = window.speechSynthesis;
                    const utterance = new SpeechSynthesisUtterance("Keep it low!");
                    utterance.onend = () => { speaking = false; };
                    const voices = speechSynth.getVoices();
                    utterance.voice = voices[0];
                    speechSynth.cancel();
                    speechSynth.speak(utterance);
                }
            } else {
                $level.css('background', '#4caf50');
                $warning.text('Acceptable');
                speaking = false; // reset flag when below threshold
            }
        }, 100);
    }

    $('#startBtn').on('click', () => {// start sound monitoring after button click
        startAudioMonitoring().catch(console.error);
        $('#startBtn').css('visibility', 'hidden');
    });
});


