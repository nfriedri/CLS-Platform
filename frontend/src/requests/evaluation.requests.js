/*
Requests to backend for Summary Evaluation.
Communciation is based on REST interface.
*/

// REST - Request available metrics with additional information
const requestMetrics = async () => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/metrics`, {
        method: "GET",
    })
    const json = await response.json()
    return json
}

// REST - Download examples
const downloadExampleFiles = async (filename) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/download-examples/${filename}`, {
        method: "GET",
    })
    const blob = await response.blob()
    return blob
}

// REST - Uplaod pred & ref file and compute evaluation scores
const requestEvaluation = async (metric, predictionsFile, referencesFile, useRefKey, refKey) => {
    var body = new FormData();
    body.append('predictions', predictionsFile);
    body.append('references', referencesFile);
    body.append('metric', metric);
    if (useRefKey) {
        body.append("ref_key", refKey);
    }
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/evaluate`, {
        method: "POST",
        mode: "cors",
        body: body
    })
    var json = await response.json()
    return json
}


export { requestMetrics, downloadExampleFiles, requestEvaluation }

/*
Alternative requests using the scoket-interface of the backend --> Only experimental.
*/
// import { socket } from '../requests/socket';
// const requestEvaluation = async (metrics, predictionsFile, referencesFile, useRefKey, refKey) => {
//     var body = new FormData();
//     body.append('predictions', predictionsFile);
//     body.append('references', referencesFile);
//     body.append('metrics', metrics);
//     body.append('sockets', true);
//     if (useRefKey) {
//         body.append('ref_key', refKey)
//     }
//     //const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/evaluate/${method}`, {
//     const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/evaluate`, {
//         method: "POST",
//         mode: "cors",
//         body: body
//     })
//     const json = await response.json();
//     return json
// }
// const requestEvaluation = async (metrics, predictionsFile, referencesFile, useRefKey, refKey) => {
//     // var files = new FormData()
//     // files.append("predictions", predictionsFile)
//     // files.append("references", referencesFile)
//     var body = new FormData();
//     body.append('predictions', predictionsFile);
//     body.append('references', referencesFile);
//     const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/evaluation-files`, {
//         method: "POST",
//         mode: "cors",
//         body: body
//     })
//     var json = await response.json()
//     console.log(json)
//     var predFileName = json["prediction_file"]
//     var refFileName = json["reference_file"]

//     var data = {
//         "metrics": metrics, "prediction_filename": predFileName, "reference_filename": refFileName
//     }
//     if (useRefKey) {
//         data["ref_key"] = refKey
//     }
//     console.log(data)
//     socket.emit("evaluation", data);
// }