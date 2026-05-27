import { JSONObjectStream } from "bufferednetworkrequest";
//#region basic-demo/index.ts
const statusEl = document.querySelector(".status");
const response = await fetch("https://jsonplaceholder.typicode.com/photos", { cache: "no-store" });
if (!response.ok) throwError(`Request failed: Code ${response.status}`);
if (!response.body) throwError(`Response was empty.`);
function throwError(message) {
	statusEl.textContent = message;
	throw new Error(message);
}
const stream = new JSONObjectStream(response.body);
for await (const objects of stream) {
	const objectElements = objects.map((object) => {
		const el = document.createElement("code");
		el.textContent = JSON.stringify(object);
		return el;
	});
	statusEl.append(...objectElements);
	scrollToBottom();
}
statusEl.classList.remove("loading");
function scrollToBottom() {
	document.body.scrollIntoView({ block: "end" });
}
//#endregion

//# sourceMappingURL=index.js.map