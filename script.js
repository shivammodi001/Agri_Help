let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let micbtn = document.querySelector("#mic");
let audioToggleBtn = document.querySelector("#audio-toggle");
let audioIcon = document.querySelector("#audio-icon");
let chatContainer = document.querySelector(".chat-container");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");

const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBorUgiWRYL3DaaAdLt2oRmTRXLIRD6_p8";

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

let isAudioEnabled = true;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

const synth = window.speechSynthesis;

audioToggleBtn.addEventListener("click", () => {
    isAudioEnabled = !isAudioEnabled;
    audioIcon.src = isAudioEnabled ? "mute.png" : "mute.png";
    audioToggleBtn.style.backgroundColor = isAudioEnabled ? "#4682b4" : "#ff4040";
    if (!isAudioEnabled) {
        synth.cancel();
    }
});

micbtn.addEventListener("click", () => {
    recognition.start();
    micbtn.style.backgroundColor = "#ffeb3b";
});

recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    prompt.value = speechResult;
    micbtn.style.backgroundColor = "#4682b4";
    handlechatResponse(speechResult);
};

recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    micbtn.style.backgroundColor = "#4682b4";
    alert("Could not understand audio. Please try again.");
};

recognition.onend = () => {
    micbtn.style.backgroundColor = "#4682b4";
};

async function generateResponse(aiChatBox, userMessage) {
    let text = aiChatBox.querySelector(".ai-chat-area");

    const creatorQuestionRegex = /(who created you|who made you|who built you)/i;
    if (creatorQuestionRegex.test(userMessage)) {
        const response = "Shivam Modi, Prithvi, and Ridham created me!";
        text.innerHTML = response;
        if (isAudioEnabled) {
            const utterance = new SpeechSynthesisUtterance(response);
            utterance.lang = 'en-US';
            utterance.rate = 1;
            utterance.pitch = 1;
            synth.speak(utterance);
        }
    } else {
        const agriculturePrompt = `You are Agri-Help, an AI assistant specialized in organic agriculture. Provide detailed and practical advice on organic farming, crops, soil management, pest control, and sustainable practices. If the question is unrelated to agriculture, politely redirect the user to ask about organic farming. User's question: ${userMessage}`;
        
        let RequestOption = {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [
                    {
                        "parts": [{ text: agriculturePrompt }, (user.file.data ? [{ inline_data: user.file }] : [])]
                    }
                ]
            })
        };
        try {
            let response = await fetch(Api_Url, RequestOption);
            let data = await response.json();
            let apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
            text.innerHTML = apiResponse;

            if (isAudioEnabled) {
                const utterance = new SpeechSynthesisUtterance(apiResponse);
                utterance.lang = 'en-US';
                utterance.rate = 1;
                utterance.pitch = 1;
                synth.speak(utterance);
            }
        } catch (error) {
            console.log(error);
            text.innerHTML = "Sorry, something went wrong. Please ask about organic farming!";
            if (isAudioEnabled) {
                const utterance = new SpeechSynthesisUtterance("Sorry, something went wrong. Please ask about organic farming!");
                synth.speak(utterance);
            }
        }
    }

    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    // Only reset the image upload icon if a file was uploaded
    if (user.file.data) {
        image.src = "img.svg";
        image.classList.remove("choose");
    }
    user.file = {};
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

function handlechatResponse(userMessage) {
    user.message = userMessage;
    let html = `<img src="user.png" alt="" id="userImage" width="8%">
<div class="user-chat-area">
${user.message}
${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
</div>`;
    prompt.value = "";
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);

    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

    setTimeout(() => {
        let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
    <div class="ai-chat-area">
    <img src="loading.webp" alt="" class="load" width="50px">
    </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox, userMessage);
    }, 600);
}

prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
        handlechatResponse(prompt.value);
    }
});

submitbtn.addEventListener("click", () => {
    handlechatResponse(prompt.value);
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string
        };
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };
    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
    imagebtn.querySelector("input").click();
});