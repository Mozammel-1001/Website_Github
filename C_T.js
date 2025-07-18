let lastTemp = 0;
let lastBpm = 0;
let lastMotion = 0;
let lastBpmStatus = null;

const channelId = 2962662;
const apiKey = "C3Z67GLGQ4JXNFSB"; // leave blank if public
const url = `https://api.thingspeak.com/channels/${channelId}/feeds/last.json?api_key=${apiKey}`;

const thresholds = {
    lowTemp: 35, // Celsius
    highTemp: 40, // Celsius
    lowBPM: 60,
    highBPM: 100,
};

let alertActive = false;
let alertDismissed = true;
let canPlaySound = false;
let soundInterval = null;

let lowTempAlert = 0;
let highTempAlert = 0;
let lowBPMAlert = 0;
let highBPMAlert = 0;
let motionAlert = 0;
let BPMAlert = 0;

const alertBox = document.getElementById("alertBox");
const overlay = document.getElementById("alertOverlay");
const alertMsg = document.getElementById("alertMsg");
const alertSound = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
alertSound.preload = "auto";

document.addEventListener("click", () => {
    if (!canPlaySound) {
        alertSound.play().then(() => {
            canPlaySound = true;
            alertSound.pause();
            alertSound.currentTime = 0;
        }).catch(() => { });
    }
});

document.getElementById('logout-btn').addEventListener('click', async function () {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/");
    });
    if (window.indexedDB && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        dbs.forEach(db => indexedDB.deleteDatabase(db.name));
    }
    if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
            await caches.delete(name);
        }
    }
    window.location.replace("index.html");
});

function fetchData() {
    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            const tempRaw = parseFloat(data.field1);
            const bpmRaw = parseInt(data.field2);
            const motionRaw = parseInt(data.field3);
            const bpmStatusRaw = parseInt(data.field4);

            const temp = isNaN(tempRaw) ? lastTemp : tempRaw;
            const bpm = isNaN(bpmRaw) ? lastBpm : bpmRaw;
            const motion = isNaN(motionRaw) ? lastMotion : motionRaw;
            const bpmStatus = isNaN(bpmStatusRaw) ? lastBpmStatus : bpmStatusRaw;

            // Update last valid values if current is valid
            if (!isNaN(tempRaw)) lastTemp = tempRaw;
            if (!isNaN(bpmRaw)) lastBpm = bpmRaw;
            if (!isNaN(motionRaw)) lastMotion = motionRaw;
            if (!isNaN(bpmStatusRaw)) lastBpmStatus = bpmStatusRaw;


            document.getElementById("temperatureBox").innerHTML =
                `<div><img src="medical.png" alt="Thermometer" style="width: 30px;"></div>
                <p class="font-medium text-xl text-[#00303C]">Temperature: ${temp}</p>`;
            document.getElementById("bpmBox").innerHTML =
                `<div><img src="heart-rate.png" alt="Heart Rate" style="width: 30px;"></div>
                <p class="font-medium text-xl text-[#00303C]">BPM: ${bpm}</p>`;
            document.getElementById("motionBox").innerHTML =
                `<p class="font-medium text-xl text-[#00303C]">Motion Status: ${motion === 1 ? "Detected" : "None"}</p>`;
            document.getElementById("bpmStatusBox").innerHTML =
                `<p class="font-medium text-xl text-[#00303C]">Pulse Sensor: ${bpmStatus === 1 ? "Attached" : "Detached"}</p>`;

            let msg = "";
            if (temp >= thresholds.highTemp) {
                msg += `High Temp: ${temp}°C\n`;
                highTempAlert++;
            }
            else {
                highTempAlert = 0;
            }

            if (temp <= thresholds.lowTemp && temp !== 0) {
                msg += `Low Temp: ${temp}°C\n`;
                lowTempAlert++;
            }
            else {
                lowTempAlert = 0;
            }

            if (bpm > thresholds.highBPM) {
                msg += `High BPM: ${bpm}\n`;
                highBPMAlert++;
            }
            else {
                highBPMAlert = 0;
            }

            if (bpm < thresholds.lowBPM && bpm !== 0) {
                msg += `Low BPM: ${bpm}\n`;
                lowBPMAlert++;
            }
            else {
                lowBPMAlert = 0;
            }

            if (motion === 1) {
                msg += `Motion Detected\n`;
                motionAlert++;
            }
            else {
                motionAlert = 0;
            }

            if (bpmStatus === 0) {
                msg += `Check the patient. the pulse sensor may be detached.\n`;
                BPMAlert++;
            }
            else {
                BPMAlert = 0;
            }

            if (msg && alertDismissed && lowTempAlert === 1) {
                if (!alertActive) {
                    showAlert(msg);
                }
            }
            else if (msg && alertDismissed && highTempAlert === 1) {
                if (!alertActive) {
                    showAlert(msg);
                }
            }

            if (msg && alertDismissed && lowBPMAlert === 1) {
                if (!alertActive) {
                    showAlert(msg);
                }
            }
            else if (msg && alertDismissed && highBPMAlert === 1) {
                if (!alertActive) {
                    showAlert(msg);
                }
            }

            if (msg && alertDismissed && motionAlert === 1) {
                if (!alertActive) {
                    showAlert(msg);
                }
            }

            if (msg && alertDismissed && BPMAlert === 1) {
                if (!alertActive) {
                    showAlert(msg);
                }
            }

        })
        .catch((err) => console.error("Fetch error:", err));
}

function showAlert(message) {
    alertMsg.textContent = message;
    alertBox.style.display = "block";
    overlay.style.display = "block";
    alertActive = true;
    alertDismissed = false;

    if (canPlaySound && !soundInterval) {
        alertSound.play();
        soundInterval = setInterval(() => {
            alertSound.currentTime = 0;
            alertSound.play().catch(() => { });
        }, 5000);
    }
}

function hideAlert() {
    alertBox.style.display = "none";
    overlay.style.display = "none";
    alertActive = false;
    stopSound();
}

function stopSound() {
    if (soundInterval) {
        clearInterval(soundInterval);
        soundInterval = null;
    }
    alertSound.pause();
    alertSound.currentTime = 0;
}

document.getElementById("closeBtn").addEventListener("click", () => {
    alertDismissed = true;
    hideAlert();
});

fetchData();
setInterval(fetchData, 35000);