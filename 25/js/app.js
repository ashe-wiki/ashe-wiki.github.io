const timeElement = document.querySelector("#time");
const startButton = document.querySelector("#start");

const DURATION = 25 * 60;

let remaining = DURATION;
let timer = null;

function render() {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    timeElement.textContent =
        `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function start() {
    if (timer !== null) {
        return;
    }

    timer = setInterval(() => {
        remaining--;

        render();

        if (remaining <= 0) {
            stop();
        }
    }, 1000);
}

function stop() {
    clearInterval(timer);
    timer = null;
}

startButton.addEventListener("click", () => {
    if (timer === null) {
        start();
        startButton.textContent = "Pause";
    } else {
        stop();
        startButton.textContent = "Start";
    }
});

render();