import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { sendLink, uploadFile, downloadStringAsFile } from './../requests/service.requests'
import { requestCrossLingualSummary } from './../requests/crossLingual.requests';
import { socket } from '../requests/socket';
import SelectCrossLingualModel from './SelectCrossLingualModel'

/*
Cross-Lingual TLDR Generation
Interface for sending requests for generating TLDRs of paper abstracts to the backend.
*/

function CrossLingual() {

    // State variable and references
    const clRef = useRef(null)

    const [linkInput, setLinkInput] = useState("")
    const [textInput, setTextInput] = useState("");
    const [summary, setSummary] = useState("");

    const [showSpinnerParsing, setShowSpinnerParsing] = useState(false);

    const [language, setLanguage] = useState("");

    const [consoleView, setConsoleView] = useState("");
    const [uploadAlert, setUploadAlert] = useState("");
    const [errorAlert, setErrorAlert] = useState("")
    const [progressValue, setProgressValue] = useState(0)


    // SocketListeners that need to be loaded on page load
    useEffect(() => {

        // Ensure that listeners are connected onyl once and not by every re-rendering.
        socket.removeAllListeners()

        // Receive summary
        socket.on("summarization", function (response) {
            setProgressValue(100)
            setSummary(response);
            executeScroll()
        })

        // Receive loading event
        socket.on("loading", async function (response) {
            //console.log(response);
            await appendTextToConsoleView(response)
            updateProgressBar()
        })

        // Receive error event
        socket.on('error', async function (response) {
            //console.log(response)
            setErrorAlert(response)
            setProgressValue(100)
            await appendTextToConsoleView(response)
        })

    }, [socket])


    // Reset state values
    const resetValues = () => {
        setErrorAlert("")
        setConsoleView("")
        setProgressValue(0)
        setSummary("")
    }

    // Change input text value on user input
    const onTextChange = (ev) => {
        setTextInput(ev.target.value);
    }

    // Empty the text input field
    const emptyFunction = () => {
        setTextInput("");
    }

    // Paste clipboard content to text input area
    const pasteFunction = async () => {
        const text = await navigator.clipboard.readText();
        setTextInput(text);
    }

    // Change link to online file on user input
    const onLinkChange = (ev) => {
        setLinkInput(ev.target.value);
    }

    // Paste clipboard content to link input
    const pasteLinkFunction = async () => {
        const text = await navigator.clipboard.readText();
        setLinkInput(text);
    }

    // Auto-scroll to summary as soon as created
    const executeScroll = () => clRef.current.scrollIntoView({ block: "end", behavior: "smooth" })

    // Receive the text from an input link
    const linkToText = async () => {
        if (linkInput.length !== 0) {
            setShowSpinnerParsing(true);
            try {
                const response = await sendLink(linkInput)
                if ("error" in response) {
                    setUploadAlert(response["error"])
                } else {
                    setTextInput(response["text"])
                }
            }
            catch (error) {
                console.error("Failed to extract data from link. Please check the provided link.")
            }
            setShowSpinnerParsing(false);
        }
    }

    // Upload a pdf file
    const fileUpload = async (ev) => {
        var file = ev.target.files[0];
        setShowSpinnerParsing(true);
        try {
            const response = await uploadFile(file, true);
            if ("error" in response) {
                setUploadAlert(response["error"])
            } else {
                setTextInput(response["text"])
            }
        }
        catch (error) {
            console.error(error)
            setUploadAlert(uploadAlert => (uploadAlert = "Error - Please check the provided link"))
        }
        setShowSpinnerParsing(false);
    }

    //Copy text to clipboard
    const copyFunction = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            //console.log('Page URL copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }

    // Append text from socket events to the consoleView box
    const appendTextToConsoleView = async (text) => {
        setConsoleView(consoleView => (consoleView + `\n --> ${text}`))
    }

    // Update the progress bar with constant value of 20
    const updateProgressBar = () => {
        var updateValue = 20
        setProgressValue(progressValue => (progressValue + updateValue));
    }

    // Set the checkpoint state to the selected one via SelectLanguage component
    const getLanguageCheckpoint = (lang) => {
        setLanguage(lang);
    }

    // Send request for TLDR generation
    const crossLingualSummarization = async () => {
        var lang = language
        resetValues()
        try {
            //setShowSpinnerSummary(true);
            var data = await requestCrossLingualSummary(lang, textInput);
            setSummary(data.toString());
            //setShowSpinnerSummary(false);
        }
        catch (error) {
            //console.error(error);
            //setShowSpinnerSummary(false);
        }
    }

    // Remove uploadAlertObject
    const removeAlert = () => {
        setUploadAlert("");
    }

    // Insert spinner
    const spinner = (
        <div className="d-flex justify-content-center mt-4">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    )

    // Insert cross when failed
    const crossLogo = (
        <div className="d-flex justify-content-center mt-3">
            <i className="fas fa-times-circle fa-2x"></i>
        </div>
    )

    // Insert check when success
    const checkLogo = (
        <div className="d-flex justify-content-center mt-3">
            <i className="fas fa-check-square fa-2x"></i>
        </div>
    )

    // Insert consoleView element
    const consolas = (
        <>
            <div className="container rounded py-1 px-2 mt-3 mb-2 text-white" style={{ backgroundColor: "#9F9F9F", whiteSpace: "pre-line" }} id="consoleView">
                <div className='row'>
                    <div className='col-11'>
                        <div className="progress mt-3" style={{ height: "30px", fontFamily: "sans-serif" }}>
                            <div className="progress-bar" role="progressbar" style={{ width: progressValue + "%" }} aria-valuenow={progressValue} aria-valuemin="0" aria-valuemax="100">{progressValue}%</div>
                        </div>
                    </div>
                    <div className='col-1'>
                        {progressValue !== 100 ? spinner : (errorAlert !== "" ? crossLogo : checkLogo)}
                    </div>
                </div>

                <hr style={{ borderColor: "black" }} />
                <div className='row' style={{ paddingBottom: "2vh" }}>
                    <div className='col-4'>
                    </div>
                    <div className='col-4'> {consoleView}
                    </div>
                    <div className='col-4'>
                    </div>
                </div>

            </div>
        </>
    )

    // Insert alert for error display
    const alertObject = (
        <div className="alert alert-danger" role="alert">
            {errorAlert}
        </div>
    )

    // Display error if link / file extraction failed
    const uploadAlertObject = (
        <div className="alert alert-danger d-flex" role="alert">
            {uploadAlert}
            <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={removeAlert}>
                <i className="fas fa-times-circle fa-lg" ></i>
            </button>
        </div>
    )

    // Insert generated summary
    const summaryOutput = (
        <>
            <div className="d-flex mt-5">
                <h4 className="my-2" >TLDR:</h4>
                <button className="btn btn-light" style={{ marginLeft: "auto", marginBottom: "1vh" }} onClick={copyFunction}>
                    <i className="fas fa-copy"></i>
                </button>
            </div>

            <div className="container rounded bg-white py-2 px-2 text-dark">
                {summary}
            </div>

            <div className="d-flex">
                <button className="btn btn-light" style={{ marginLeft: "auto", marginBottom: 1, marginTop: "1vh" }} onClick={() => downloadStringAsFile(summary, "summary")} ref={clRef}>
                    <i className="fas fa-file-download"></i> Download
                </button>
            </div>
        </>
    );

    return (
        <>
            <div className="container-flex rounded py-5 px-3 ">

                <div className="container-lg rounded text-white my-2 mb-4" style={{ backgroundColor: "#008000" }}>

                    <div className="container py-3 px-3">
                        <h3>Cross-lingual TLDR generation for scientific articles</h3>
                    </div>

                    <div className="container py-3 px-3">
                        <p> Cross-lingual summarization using pre-trained mBART models.
                            Simply copy the abstract of an scientific paper into the text input field, upload the articles paper or provide an link to the hosted pdf to get started.
                            Currently only abstracts are supported for TLDR generation due to size limitations.
                            If the TLDR should be based on longer parts of the paper, please try the trained LED model for english available in the monolinngual summarization section of this app.
                        </p>
                    </div>

                </div>
                <div className="container-lg rounded bg-dark text-white my-2 mb-4">

                    <div className="container py-3 px-3 mt-3">
                        <label className="form-label mt-1" htmlFor="inputFile">Upload a pdf file:</label>
                        <div className="input-group mb-3">
                            <input type="file" className="form-control" id="inputFile" aria-describedby="inputGroupFileAddon" aria-label="Upload" onChange={fileUpload} />


                        </div>
                        <div className="input-group mb-3">
                            <span className="input-group-text" id="labelPaste" >Link:</span>
                            <input type="text" className="form-control" placeholder="Paste an arxic, acl or hosted pdf link here" aria-label="pasteLinkHere" aria-describedby="labelPaste" value={linkInput} onChange={onLinkChange}></input>

                            <button className="btn btn-secondary" onClick={pasteLinkFunction}>
                                <i className="fas fa-paste"></i>
                            </button>
                            <button className="btn btn-light" onClick={linkToText}>
                                Go
                            </button>
                        </div>
                        {uploadAlert !== "" ? uploadAlertObject : ""}
                        {showSpinnerParsing === true ? spinner : ""}
                        <div className="d-flex">
                            <label className="form-label mt-1" htmlFor="text-input">Or copy abstract here:</label>
                            <button type="button" className="btn btn-light" style={{ marginLeft: "auto", marginBottom: "1vh" }} onClick={emptyFunction} data-placement="top" title="Empty text area">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                            <button type="button" className="btn btn-light" style={{ marginLeft: "1vh", marginBottom: "1vh" }} onClick={pasteFunction} data-placement="top" title="Paste clipboard contents">
                                <i className="fas fa-paste"></i>
                            </button>
                        </div>
                        <textarea className="form-control custom-textarea" id="text-input" rows="10" value={textInput} onChange={onTextChange}></textarea>

                    </div>

                    <hr className="custom-sep" />

                    <SelectCrossLingualModel setLanguageCheckpoint={getLanguageCheckpoint} />

                    <hr className="custom-sep" />

                    <div className="container rounded pt-3 pb-4 px-2 mt-3">
                        <div className="d-grid gap-2">
                            <button className="btn btn-primary" onClick={() => crossLingualSummarization()}>Generate TLDR</button>
                        </div>


                        {consoleView !== "" ? consolas : ""}
                        {errorAlert !== "" ? alertObject : ""}
                        {summary !== "" ? summaryOutput : ""}
                    </div>
                </div>
            </div>

        </>
    )
}

export default CrossLingual
