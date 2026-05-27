
const statusEl = document.querySelector('.status')!
const throttleSelect = document.querySelector<HTMLSelectElement>('#throttle')!
const runButton = document.querySelector<HTMLButtonElement>('#run')!
const cancelButton = document.querySelector<HTMLButtonElement>('#cancel')!


export function getSelectedProfile() {
    return throttleSelect.value
}


export function setRunning(value: boolean) {
    runButton.disabled = value
    cancelButton.disabled = !value
}


export function onRun(handler: () => void) {
    runButton.addEventListener('click', handler)
}

export function onCancel(handler: () => void) {
    cancelButton.addEventListener('click', handler)
}


export function clear() {
    statusEl.innerHTML = ''
}


export function log(tag: string, text: string) {
    const el = document.createElement(tag)
    el.textContent = text
    statusEl.appendChild(el)
    scrollToBottom()
}


export function scrollToBottom() {
    document.body.scrollIntoView({ block: 'end' })
}

export function round(value: number, decimals: number) {
    const m = 10 ** decimals
    return Math.round(value * m) / m
}
