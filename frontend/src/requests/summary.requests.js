import { socket } from './socket'

/*
Requests for Summary module.
Communciation is socket-based using socket.io and REST-based.
*/

// REST - Request available checkpoints with additional information 
const requestCheckpoints = async () => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/checkpoints`, {
        method: "GET",
    })
    const json = await response.json()
    return json
}

// Socket.io - Request summary of text
const requestSummary = async (model, truncation, text, huggingface) => {
    var data = { "model": model, "truncation": truncation, "text": text, "huggingface": huggingface }
    //console.log(data)
    socket.emit("summarization", data)
    //return "Send data"
}

// Socket.io - Request cascading summary
const requestCascadingSummary = async (model, text, huggingface) => {
    var data = { "model": model, "text": text, "huggingface": huggingface }
    //console.log(data)
    socket.emit("cascading-summarization", data)
}


export { requestCheckpoints, requestSummary, requestCascadingSummary }

/*
Alternative request using the REST-interface of the backend.
*/
// const requestSummary = async (model, text) => {
//     socket.emit("summarization", "data")
//     var body = JSON.stringify({ text: text })
//     const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/summarize?model=${model}`, {
//         method: "POST",
//         mode: "cors",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: body
//     })
//     const json = await response.json();
//     return json["summary"]
// }
// const requestCascadingSummary = async (model, text) => {
//     var body = JSON.stringify({ text: text })
//     const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/summarize-cascading?model=${model}`, {
//         method: "POST",
//         mode: "cors",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: body
//     })
//     const json = await response.json();
//     return json["summary"]
//}