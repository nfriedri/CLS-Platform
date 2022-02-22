import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { socket } from './../requests/socket'
import { uploadFile, sendLink } from './../requests/service.requests'
import { requestSummary, requestCascadingSummary } from './../requests/summary.requests';
import SelectModel from './SelectModel';

/*
Summarizer Interface
Enables users to summarize input texts using SOTA transformer-based models
*/

const Summarizer = () => {

    // State variables and references
    const sumRef = useRef(null);

    //Input
    const [linkInput, setLinkInput] = useState("");
    const [textInput, setTextInput] = useState("");

    //Display
    const [consoleView, setConsoleView] = useState("");
    const [summary, setSummary] = useState("");
    const [uploadAlert, setUploadAlert] = useState("");
    const [errorAlert, setErrorAlert] = useState("");
    const [showSpinnerParsing, setShowSpinnerParsing] = useState(false);
    const [showSpinnerSummary, setShowSpinnerSummary] = useState(false);
    const [progressValue, setProgressValue] = useState(0);

    //For summarization request
    const [checkpoint, setCheckpoint] = useState("");
    const [truncation, setTruncation] = useState(false);
    const [slices, setSlices] = useState(1);
    const [abstractOnly, setAbstractOnly] = useState(true);
    const [alternativeHF, setAlternativeHF] = useState(false);


    // Set socket listeners on page load
    useEffect(() => {

        socket.removeAllListeners();

        socket.on("summarization", function (response) {
            //console.log(response)
            setShowSpinnerSummary(false)
            setProgressValue(100)
            setSummary(response);
            executeScroll()
            //socket.removeAllListeners();
            //setConsoleView("")
        });

        socket.on("slices", function (response) {
            //console.log(response);
            setSlices(parseInt(response));
            //socket.removeAllListeners();
        });

        socket.on("loading", async function (response) {
            //console.log(response);
            await appendTextToConsoleView(response)
            updateProgressBar()
        });

        socket.on('error', async function (response) {
            //console.log(response)
            setShowSpinnerSummary(false)
            setErrorAlert(response)
            setProgressValue(100)
            await appendTextToConsoleView(response)
            //setConsoleView(`${consoleView} \n --> ${response}`)
        });

    }, [socket])

    // Reset state variables
    const resetValues = () => {
        setErrorAlert("")
        setConsoleView("")
        setProgressValue(0)
        setSummary("")
        setSlices(1)
    }

    // Append text to the consoleview element
    const appendTextToConsoleView = async (text) => {
        //console.log(`ConsoleVIEW:  ${consoleView}`)
        setConsoleView(consoleView => (consoleView + `\n --> ${text}`))
    }

    // Update the progress bar dynamically
    const updateProgressBar = () => {
        var updateValue = 60 / slices / 3
        setProgressValue(progressValue => (progressValue + updateValue));
    }

    // Get the selected checkpoint from the SelectModel sub-component
    const getModelCheckpoint = (model) => {
        setCheckpoint(model);
    }

    // Get the enable/disable truncation variable from the SelectModel sub-component
    const getTruncationValue = (truncationValue) => {
        setTruncation(truncationValue);
    }

    // Get the enable/disable hugginface alternative variable from the SelectModel sub-component
    const getAlternativeHFValue = (alternativeValue) => {
        setAlternativeHF(alternativeValue);
        //console.log("AlternativeHF VALUE in summarizer: " + alternativeValue)
    }

    // Update text state when input changes
    const onTextChange = (ev) => {
        setTextInput(ev.target.value);
    }

    // Auto scorell when summary is computed
    const executeScroll = () => sumRef.current.scrollIntoView({ block: "end", behavior: "smooth" })

    // Upload file to extract text
    const fileUpload = async (ev) => {
        var file = ev.target.files[0];
        setShowSpinnerParsing(true)
        try {
            const response = await uploadFile(file, abstractOnly);
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
        setShowSpinnerParsing(false)
    }

    // Empty text input
    const emptyFunction = () => {
        setTextInput("");
    }

    // Paste text from clipboard to input field
    const pasteFunction = async () => {
        const text = await navigator.clipboard.readText();
        setTextInput(text);
    }

    // Copy generated summary to clipboard
    const copyFunction = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            //console.log('Page URL copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }

    //Change link to online file on user input
    const onLinkChange = (ev) => {
        setLinkInput(ev.target.value);
    }

    //Paste clipboard content to link input
    const pasteLinkFunction = async () => {
        const text = await navigator.clipboard.readText();
        setLinkInput(text);
    }

    // Extract text from provided link
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

    // Enable/disable abstract only for text extraction
    const selectAbstractOnly = () => {
        setAbstractOnly(!abstractOnly)
    }

    // Request summary
    const getSummary = async () => {
        var model = checkpoint;
        resetValues()
        try {
            setShowSpinnerSummary(true);
            var data = await requestSummary(model, truncation, textInput, alternativeHF);
            setSummary(data.toString());
            setShowSpinnerSummary(false);
        }
        catch (error) {
            //console.error(error);
            setShowSpinnerSummary(false);
        }
        setSlices(slices => (slices = 1))
    }

    // Request cascading summarization
    const getCascadingSummary = async () => {
        var model = checkpoint;
        resetValues()
        try {
            setShowSpinnerSummary(true);
            var data = await requestCascadingSummary(model, textInput, alternativeHF);
            setSummary(data.toString());
            setShowSpinnerSummary(false);
        }
        catch (error) {
            //console.error(error);
            setShowSpinnerSummary(false);
        }
    }

    // Download the generated summary
    const downloadSummary = () => {
        var dataString = "data:text/plain;charset=utf-16," + encodeURIComponent(summary);
        var anchor = document.createElement('a');
        anchor.href = dataString;
        anchor.download = "summary.txt";
        anchor.target = "_blank";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }

    // Remove uploadAlertObject
    const removeAlert = () => {
        setUploadAlert("");
    }

    // Insert spinner
    const spinner = (
        <div className="d-flex justify-content-center mt-3">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    )

    // Insert crossLogo
    const crossLogo = (
        <div className="d-flex justify-content-center mt-3" >
            <i className="fas fa-times-circle fa-2x" ></i>
        </div>
    )

    // Insert checkLogo
    const checkLogo = (
        <div className="d-flex justify-content-center mt-3" >
            <i className="fas fa-check-square fa-2x" ></i>
        </div>
    )

    // Insert consoleview box
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

    // Insert alert element to display errors
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

    // Display generated summary
    const summaryOutput = (
        <>
            <div className="d-flex mt-5">
                <h4 className="my-2" >Summary</h4>
                <button className="btn btn-light" style={{ marginLeft: "auto", marginBottom: "1vh" }} onClick={copyFunction}>
                    <i className="fas fa-copy"></i>
                </button>
            </div>

            <div className="container rounded bg-white py-2 px-2 text-dark">
                {summary}
            </div>

            <div className="d-flex">
                <button className="btn btn-light" style={{ marginLeft: "auto", marginBottom: 1, marginTop: "1vh" }} onClick={downloadSummary} ref={sumRef}>
                    <i className="fas fa-file-download"></i> Download
                </button>
            </div>
        </>
    );

    return (
        <>
            <div className="container-flex rounded py-5 px-3 " >

                <div className="container-lg rounded text-white my-2 mb-4" style={{ backgroundColor: "#38B000" }} >

                    <div className="container py-3 px-3" >
                        <h3>Monolingual Summarizer</h3>
                    </div>

                    <div className="container py-3 px-3">
                        <p> Summarization using pre-trained state-of-the-arts summarization models.
                            Simply insert text below, or alternatively upload a text or pdf file, or provide an link to a hosted pdf to get started.
                            The unique characteristics of the diverse models are explained when being selected.
                            Longer input texts can either be truncated to fit into the models or alternatively cascading summarization can be applied.
                            Cascading summarization splits the text into slices and then summarizes each slice on its own.
                            Afterwards, the intermediate summaries are concatenated and depending on the number of slices summarized again to retrive the final summary.
                        </p>
                    </div>
                </div>


                <div className="container-lg rounded bg-dark text-white my-2 mb-4" >

                    <div className="container py-3 px-3 mt-3">
                        <label className="form-label mt-1" htmlFor="inputFile">Upload a text/pdf file:</label>
                        <div className="form-check form-switch d-flex mb-3">
                            <input className="form-check-input" type="checkbox" role="switch" id="switchAbstract" checked={abstractOnly} style={{ marginLeft: "auto", marginRight: "1vh" }} onChange={selectAbstractOnly} />
                            <label className="form-check-label" htmlFor="switchAbstract" >Extract Abstract only</label>
                        </div>
                        <div className="input-group mb-3">
                            <input type="file" className="form-control" id="inputFile" aria-describedby="inputGroupFileAddon" aria-label="Upload" onChange={fileUpload} />
                            <label className="input-group-text" type="button" id="inputGroupFileAddon">Upload file</label>
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
                            <label className="form-label mt-1" htmlFor="text-input">Or copy text here:</label>
                            <button type="button" className="btn btn-light" style={{ marginLeft: "auto", marginBottom: "1vh" }} onClick={emptyFunction} data-placement="top" title="Empty text area">
                                <i className="fas fa-trash-alt" ></i>
                            </button>
                            <button type="button" className="btn btn-light" style={{ marginLeft: "1vh", marginBottom: "1vh" }} onClick={pasteFunction} data-placement="top" title="Paste clipboard contents">
                                <i className="fas fa-paste"></i>
                            </button>
                        </div>
                        <textarea className="form-control custom-textarea" id="text-input" rows="10" value={textInput} onChange={onTextChange}></textarea>

                    </div>

                    <hr className="custom-sep" />

                    <SelectModel setModelCheckpoint={getModelCheckpoint} setTruncationValue={getTruncationValue} setAlternativeValue={getAlternativeHFValue} />

                    <hr className="custom-sep" />

                    <div className="container rounded pt-3 pb-4 px-2 mt-3">
                        <div className="row">
                            <div className="col-6">
                                <div className="d-grid gap-2">
                                    <button className="btn btn-primary" onClick={getSummary} disabled={checkpoint !== "" ? false : true}>Summarize</button>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="d-grid gap-2">
                                    <button className="btn btn-primary" onClick={getCascadingSummary} disabled={checkpoint !== "" ? false : true}>Summarize Cascading</button>
                                </div>
                            </div>
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

export default Summarizer
