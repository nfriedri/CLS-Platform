/*
General requests to the backend used by multiple modules.
*/

// REST - Connection tests request -- Not used in production mode
const connectionTest = async () => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/`, {
        method: "GET",
        mode: "cors",
    })
    var text = await response.text()
    //console.log(text);
    return text;
}

// REST - send link to backend to extract text
const sendLink = async (linkText) => {
    var body = JSON.stringify({ link: linkText })
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/link-to-text`, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: body
    })
    const json = await response.json()
    return json
}

// REST - uplaod file to extract text
const uploadFile = async (file, abstractOnly) => {
    var body = new FormData();
    body.append('file', file);
    var url = `${process.env.REACT_APP_BACKEND_URL}/file-to-text`
    if (abstractOnly) {
        url += "?abstract-only=True"
    }
    const response = await fetch(url, {
        method: "POST",
        mode: "cors",
        body: body
    })
    const json = await response.json();
    return json
}

// Download string data as file
const downloadStringAsFile = (text, filename) => {
    var dataString = "data:text/plain;charset=utf-16," + encodeURIComponent(text);
    var anchor = document.createElement('a');
    anchor.href = dataString;
    anchor.download = filename + ".txt";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

export { connectionTest, downloadStringAsFile, sendLink, uploadFile }