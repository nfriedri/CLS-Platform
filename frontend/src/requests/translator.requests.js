import { socket } from './socket'

/*
Requests for Translator module.
Communciation is socket-based using socket.io and REST-based.
*/


// REST - Get available target languages
const requestLanguages = async () => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/translate/languages`, {
            method: "GET",
        })
        const json = await response.json()
        //console.log(json)
        return json
    } catch (error) {
        console.error(error);
    }

}

// Socket-io - Request Translation of input text
const requestTranslation = async (text, tgtLang, opus) => {
    var data = { "text": text, "tgt-lang": tgtLang, "opus": opus }
    //console.log(data)
    socket.emit('translation', data)
}


export { requestLanguages, requestTranslation }

/*
Alternative request using the REST-interface of the backend.
*/
// const requestTranslation = async (text, opus, targetLang) => {
//     var body = JSON.stringify({ text: text })
//     const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/translate?tgt-lang=${targetLang}`, {
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