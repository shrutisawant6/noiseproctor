$(function () {
    const $level = $('.level');
    const $warning = $('.warning');
    const thresholdForNose = -7; // threshold for loud sound
    let speaking = false; // to avoid repeated speech
    var speechStatements = [
        "Ouch, too loud. Can you keep it low!",
        "Dude, we need a serious Decibel Diet!",
        "Man, stop being boisterous!",
        "My eardrums are hurting! Keep it down!",
        "Hey, chill out and lower it down!"];

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

                    // // pick up a random statement
                    // var randomIndex = Math.floor(Math.random() * speechStatements.length);
                    // var noiseUtterance = speechStatements[randomIndex];

                    // // speak the selected statement
                    // const speechSynth = window.speechSynthesis;
                    // const utterance = new SpeechSynthesisUtterance(noiseUtterance);
                    // utterance.onend = () => { speaking = false; };
                    // const voices = speechSynth.getVoices();
                    // utterance.voice = voices[0];
                    // speechSynth.speak(utterance);


                    var noiseUtterance = getRandomStatment();// pick up a random statement

                    // speak the selected statement
                    const speechSynth = window.speechSynthesis;
                    const utterance = new SpeechSynthesisUtterance(noiseUtterance);
                    utterance.onend = () => { speaking = false; };
                    const voices = speechSynth.getVoices();
                    utterance.voice = getPreferredVoice(voices) || voices[0];
                    speechSynth.speak(utterance);
                }
            } else {
                $level.css('background', '#4caf50');
                $warning.text('Acceptable');
                speaking = false; // reset flag when below threshold
            }
        }, 100);

        //get random statement
        function getRandomStatment() {
            var randomIndex = Math.floor(Math.random() * speechStatements.length);
            return speechStatements[randomIndex];
        }

        //get preferred voice for speech
        function getPreferredVoice(voices) {
            return voices.find(v => /female/i.test(v.name)) || // has "female" in name
                voices.find(v => v.name.includes("Google US English")) || // chrome default mature female
                voices.find(v => v.name.includes("Samantha")) || // macOS female voice
                voices.find(v => v.lang === "en-US"); // fallback English voice
        }
    }

    $('#startBtn').on('click', () => {// start sound monitoring after button click
        startAudioMonitoring().catch(console.error);
        $('#startBtn').css('visibility', 'hidden');
    });
});




