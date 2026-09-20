const timeElement = document.querySelector("#time");
const skipButton = document.querySelector("#skip");
const optionButtons = document.querySelectorAll(".timer__option");
const daysLeftElement = document.querySelector("#days-left");
const progressElement = document.querySelector("#progress");

const CIRCUMFERENCE = 2 * Math.PI * 90;

progressElement.style.strokeDasharray = CIRCUMFERENCE;

let duration = 25 * 60;
let endTime = null;
let timer = null;

function getRemaining() {
    if (endTime === null) return duration;
    const diff = Math.ceil((endTime - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
}

function updateDaysLeft() {
    const now = new Date();
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const diff = endOfYear - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    daysLeftElement.textContent = `${days} days left in ${now.getFullYear()}`;
}

function playBeep(freq, dur) {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = "sine";

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
}

function playStartSound() {
    playBeep(800, 0.15);
    setTimeout(() => playBeep(1000, 0.15), 150);
}

function playEndSound() {
    playBeep(600, 0.3);
    setTimeout(() => playBeep(800, 0.3), 300);
    setTimeout(() => playBeep(1000, 0.5), 600);
}

function render() {
    const remaining = getRemaining();
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    timeElement.textContent =
        `${minutes}:${seconds.toString().padStart(2, "0")}`;

    const progress = duration > 0 ? (duration - remaining) / duration : 1;
    const offset = CIRCUMFERENCE * (1 - progress);
    progressElement.style.strokeDashoffset = offset;
}

function start() {
    if (endTime !== null) {
        return;
    }

    playStartSound();

    endTime = Date.now() + duration * 1000;

    timer = setInterval(() => {
        const remaining = getRemaining();

        render();

        if (remaining <= 0) {
            stop();
            playEndSound();
        }
    }, 250);
}

function stop() {
    clearInterval(timer);
    timer = null;
    endTime = null;
}

function reset() {
    stop();
    render();
}

function skip() {
    stop();
    endTime = Date.now();
    render();
    playEndSound();
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        render();
        if (endTime !== null && getRemaining() <= 0) {
            stop();
            playEndSound();
        }
    }
});

skipButton.addEventListener("click", skip);

optionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        optionButtons.forEach((b) => b.classList.remove("timer__option--active"));
        btn.classList.add("timer__option--active");

        duration = parseInt(btn.dataset.minutes) * 60;
        stop();
        render();
        start();
    });
});

updateDaysLeft();
render();
