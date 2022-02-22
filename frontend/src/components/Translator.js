import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { uploadFile, downloadStringAsFile, sendLink } from './../requests/service.requests'
import { requestTranslation } from '../requests/translator.requests';
import { socket } from '../requests/socket';
import SelectLanguage from './SelectLanguage';

/*
Translator component
Enables users to translate input texts.
*/

function Translator() {

    // State variables and references
    const tranRef = useRef(null)

    const [linkInput, setLinkInput] = useState("")
    const [textInput, setTextInput] = useState("");
    const [translation, setTranslation] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("");
    const [opus, setOpus] = useState(false);

    const [consoleView, setConsoleView] = useState("");
    const [errorAlert, setErrorAlert] = useState("")
    const [uploadAlert, setUploadAlert] = useState("");
    const [showSpinnerParsing, setShowSpinnerParsing] = useState(false);
    const [progressValue, setProgressValue] = useState(0)
    const [slices, setSlices] = useState(1)

    const [abstractOnly, setAbstractOnly] = useState(true)


    // Connect sockets on page load
    useEffect(() => {

        socket.removeAllListeners()

        socket.on("translation", function (response) {
            //console.log(response)
            //setShowSpinner(showSpinner => (showSpinner = false))
            setProgressValue(100)
            setTranslation(response);
            //socket.removeAllListeners();
            //setConsoleView("")
        })

        socket.on("slices", function (response) {
            //console.log(response);
            setSlices(parseInt(response));
            //socket.removeAllListeners();
        })

        socket.on("loading", async function (response) {
            //console.log(response);
            appendTextToConsoleView(response)
            updateProgressBar()
        })

        socket.on('error', async function (response) {
            //console.log(response)
            setProgressValue(100)
            //setShowSpinner(showSpinner => ("false"))
            appendTextToConsoleView(response)
            setErrorAlert(response)
            //setConsoleView(`${consoleView} \n --> ${response}`)

        })

    }, [socket])


    // Change text on text input change
    const onTextChange = (ev) => {
        setTextInput(ev.target.value);
    }

    //Change link to online file on user input
    const onLinkChange = (ev) => {
        setLinkInput(ev.target.value);
    }

    // Auto scroll to translation as soon as computed
    const executeScroll = () => tranRef.current.scrollIntoView({ block: "end", behavior: "smooth" })

    //Paste clipboard content to link input
    const pasteLinkFunction = async () => {
        const text = await navigator.clipboard.readText();
        setLinkInput(text);
    }

    // Extract text from link request
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

    // Upload a file to the server
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

    // Paste clipboard content to text input field
    const pasteFunction = async () => {
        const text = await navigator.clipboard.readText();
        setTextInput(text);
    }

    // Copy translation to clipboard
    const copyFunction = async () => {
        try {
            await navigator.clipboard.writeText(translation);
            //console.log('Page URL copied to clipboard');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }

    // Get selected tgt language from SelectLanguage component
    const getLanguageCheckpoint = (lang) => {
        setTargetLanguage(lang);
    }

    // Get if opus is selected from SelectLanguage component
    const getOpusValue = (opusValue) => {
        setOpus(opusValue);

    }

    // Empty the text input field
    const emptyFunction = () => {
        setTextInput("");
    }

    // Select abstract only mode for file/link to text
    const selectAbstractOnly = () => {
        setAbstractOnly(!abstractOnly)
    }

    // Request translation of input text
    const translateInput = async () => {
        await resetValues()
        try {
            var data = await requestTranslation(textInput, targetLanguage, opus);
            setTranslation(data.toString());
        }
        catch (error) {
            //console.error(error);
        }
        setSlices(slices => (slices = 1))
    }

    // Reset state values
    const resetValues = async () => {
        setSlices(slices => (slices = 1))
        setProgressValue(progressValue => (progressValue = 0))
        setErrorAlert("")
        setConsoleView("")
        setTranslation("")
    }

    // Append text to the consoleView element
    const appendTextToConsoleView = (text) => {
        //console.log(`ConsoleVIEW:  ${consoleView}`)
        setConsoleView(consoleView => (consoleView + `\n --> ${text}`))
    }

    // Update the progress bar with dynamic value
    const updateProgressBar = () => {
        //console.log(slices)
        var updateValue = 1
        if (slices === 1) {
            var updateValue = 10
        }
        else {
            var updateValue = Math.round(70 / slices)
        }
        setProgressValue(progressValue => (progressValue + updateValue));
    }

    // Remove uploadAlertObject
    const removeAlert = () => {
        setUploadAlert("");
    }

    // Insert a spinner object
    const spinner = (
        <div className="d-flex justify-content-center mt-3">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    // Insert crossLogo
    const crossLogo = (
        <div className="d-flex justify-content-center mt-3">
            <i className="fas fa-times-circle fa-2x"></i>
        </div>
    )

    // Insert checkLogo
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
                <div className='row' style={{ paddingBottom: "2vh", maxHeight: "25vh", overflow: "scroll", overflowX: "hidden", marginRight: "1px", display: "flex", flexDirection: "column-reverse" }}>
                    <div className='col-3'>
                    </div>
                    <div className='col-6'> {consoleView}
                    </div>
                    <div className='col-3'>
                    </div>
                </div>

            </div>
        </>
    )

    // Insert an alert element to display errors
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

    // Display the translated text
    const translationOutput = (
        <>
            <div className="d-flex mt-5">
                <h4 className="my-2" >Generated Translation:</h4>
                <button className="btn btn-light" style={{ marginLeft: "auto", marginBottom: "1vh" }} onClick={copyFunction}>
                    <i className="fas fa-copy"></i>
                </button>
            </div>

            <div className="container rounded bg-white py-2 px-2 text-dark">
                {translation}
            </div>

            <div className="d-flex">
                <button className="btn btn-light" style={{ marginLeft: "auto", marginBottom: 1, marginTop: "1vh" }} onClick={() => downloadStringAsFile(translation, "translation")} ref={tranRef}>
                    <i className="fas fa-file-download"></i> Download
                </button>
            </div>
        </>
    );

    return (
        <>
            <div className="container-flex rounded py-5 px-3 ">

                <div className="container-lg rounded text-white my-2 mb-4" style={{ backgroundColor: "#006400" }}>

                    <div className="container py-3 px-3">
                        <h3>Machine Translations</h3>
                    </div>

                    <div className="container pt-3 pb-2 px-3">
                        <p>This module provides state-of-the-art machine translations using the mBART-large-50-many-to-many-mmt model.
                            Simply insert the input text below, select a target language to which the text should be translated and start the translation process.
                            In case the provided input text is too long, it is automatically split into slices per sentence.
                            The slices then are translated sentence-per-sentence.
                        </p>

                    </div>

                </div>
                <div className="container-lg rounded bg-dark text-white my-2 mb-4">


                    <div className="container py-3 px-3 mt-3">
                        <label className="form-label mt-1" htmlFor="inputFile">Upload a pdf file:</label>
                        <div className="form-check form-switch d-flex mb-3">
                            <input className="form-check-input" type="checkbox" role="switch" id="switchAbstract" checked={abstractOnly} style={{ marginLeft: "auto", marginRight: "1vh" }} onChange={selectAbstractOnly} />
                            <label className="form-check-label" htmlFor="switchAbstract" >Extract Abstract only</label>
                        </div>
                        <div className="input-group mb-1">
                            <input type="file" className="form-control" id="inputFile" aria-describedby="inputGroupFileAddon" aria-label="Upload" onChange={fileUpload} />
                            <label className="input-group-text" type="button" id="inputGroupFileAddon">Upload pdf file</label>
                        </div>
                        <div className="input-group mb-3">
                            <span className="input-group-text" id="labelPaste" >Link:</span>
                            <input type="text" className="form-control" placeholder="Paste Link here" aria-label="pasteLinkHere" aria-describedby="labelPaste" value={linkInput} onChange={onLinkChange}></input>

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
                            <label className="form-label mt-1" htmlFor="text-input">Copy your text here:</label>
                            <button type="button" className="btn btn-light" style={{ marginLeft: "auto", marginBottom: "1vh" }} onClick={emptyFunction} data-placement="top" title="Empty text area">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                            <button className="btn btn-light" style={{ marginLeft: "1vh", marginBottom: "1vh" }} onClick={pasteFunction}>
                                <i className="fas fa-paste"></i>
                            </button>
                        </div>
                        <textarea className="form-control custom-textarea" id="text-input" rows="10" value={textInput} onChange={onTextChange}></textarea>

                    </div>

                    <hr className="custom-sep" />

                    <SelectLanguage setTargetLanguage={getLanguageCheckpoint} setOpusValue={getOpusValue} />

                    <hr className="custom-sep" />

                    <div className="container rounded pt-3 pb-4 px-2 mt-3">
                        <div className="row">
                            <div className="d-grid gap-2">
                                <button className="btn btn-primary" onClick={() => translateInput(true, false)}>Translate</button>
                            </div>

                        </div>

                        {consoleView !== "" ? consolas : ""}
                        {errorAlert !== "" ? alertObject : ""}
                        {translation !== "" ? translationOutput : ""}
                    </div>
                </div>
            </div>

        </>
    )
}

export default Translator
