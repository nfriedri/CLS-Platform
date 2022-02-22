import { socket } from '../requests/socket';

/*
Requests to backend for Cross-Lingual TLDR Generation.
Communciation is socket-based using socket.io and REST-based.
*/

// REST - Request available languages with model information.
const requestLanguages = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cross-lingual/languages`, {
            method: "GET",
        })
        const json = await response.json()
        return json
    } catch (error) {
        console.error(error);
        //alert(error);
    }

}

// Socket.io - Request to generate TLDRs in selected target language
const requestCrossLingualSummary = async (lang, text) => {
    var data = { "tgt_lang": lang, "text": text }
    socket.emit("cross-lingual-summarization", data)
}


export { requestLanguages, requestCrossLingualSummary }


/*
Alternative request using the REST-interface of the backend.
*/
// const preloadModel = async (targetLang) => {
//     const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/preload/cross-lingual?tgt-lang=${targetLang}`, {
//         method: "GET",
//     })
//     const json = await response.json()
//     return json;
// }
// const requestCrossLingualSummary = async (text, targetLang) => {
//     var body = JSON.stringify({ text: text })
//     const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/cross-lingual?tgt-lang=${targetLang}`, {
//         method: "POST",
//         mode: "cors",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: body
//     })
//     const json = await response.json();
//     return json["output"]
// }