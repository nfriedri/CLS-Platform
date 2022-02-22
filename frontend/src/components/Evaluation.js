import React from 'react'
import { useState } from 'react';
import { downloadExampleFiles, requestEvaluation } from './../requests/evaluation.requests';
import SelectEvaluation from './SelectEvaluation';

/*
Summary Evaluation
Interface to evaluate summaries by uploading prediction and reference files
*/

const Evaluation = () => {

    // State variables
    const [predFile, setPredFile] = useState({});
    const [refFile, setRefFile] = useState({});
    const [scores, setScores] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState([]);

    const [showKeyField, setShowKeyField] = useState(false);
    const [refKey, setRefKey] = useState("target");

    const [consoleView, setConsoleView] = useState("");
    const [progressValue, setProgressValue] = useState(0)
    const [errorAlert, setErrorAlert] = useState("")


    // Upload predictions file
    const uploadPreds = async (ev) => {
        var file = ev.target.files[0];
        setPredFile(file);
    }

    // Upload references file
    const uploadRefs = async (ev) => {
        var file = ev.target.files[0];
        var fileName = file.name.split(".")
        var fileEnding = fileName[fileName.length - 1]
        if (fileEnding === "json" || fileEnding === "jsonl") {
            setShowKeyField(true);
        }
        else {
            setShowKeyField(false);
        }
        setRefFile(file);
    }

    // Change key on Input
    const updateKeyField = (ev) => {
        setRefKey(ev.target.value);
    }

    // Get the selected metrics from SelectEvaluation component
    const getSelectedMetrics = (metric) => {
        //console.log(metric)
        setSelectedMetric(metric)
    }

    // Append text to the consoleView element
    const appendTextToConsoleView = async (text) => {
        //console.log(`ConsoleVIEW:  ${consoleView}`)
        setConsoleView(consoleView => (consoleView + `\n --> ${text}`))
        updateProgressBar();
    }

    // Reset the state variables to default
    const resetValues = async () => {
        setErrorAlert("")
        setConsoleView("")
        setProgressValue(0)
        await setScores([])
    }

    // Send evaluation requests
    const evaluate = async () => {
        await resetValues()
        appendTextToConsoleView("Starting Evaluation")
        for (var i = 0; i < selectedMetric.length; i++) {
            await appendTextToConsoleView(`Evaluating using ${selectedMetric[i]}.`)
            try {
                var data = await requestEvaluation(selectedMetric[i], predFile, refFile, showKeyField, refKey)
                setScores(prevScores => {
                    return [...prevScores, data]
                })
                //console.log(data)
            }
            catch (error) {
                setErrorAlert("An server error occured. Please try again.")
                console.error(error)
            }
        }
        appendTextToConsoleView("Finished Evaluation.")
        setProgressValue(100)
    }

    // Update progress bar with dynamic value depending on number of selected metrics
    var updateProgressBar = () => {
        var updateValue = 10
        if (selectedMetric.length === 0) {
            updateValue = Math.round(100 / 6)
        } else {
            updateValue = Math.round(100 / (selectedMetric.length + 2))
        }
        setProgressValue(progressValue => (progressValue + updateValue));
    }

    // Insert spinner element
    const spinner = (
        <div className="d-flex justify-content-center mt-3">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Computing...</span>
            </div>
        </div>
    )

    // Insert cross logo element
    const crossLogo = (
        <div className="d-flex justify-content-center mt-3" >
            <i className="fas fa-times-circle fa-2x" ></i>
        </div>
    )

    // Insert check logo element
    const checkLogo = (
        <div className="d-flex justify-content-center mt-3" >
            <i className="fas fa-check-square fa-2x" ></i>
        </div>
    )

    // Insert console view element
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

    // Insert additional input element for target keys in json/jsonl files
    const keyInput = (
        <div>
            <label className="form-label mt-1" htmlFor="inputFile">Enter the key name of the references:</label>
            <div className="input-group mb-3">
                <span className="input-group-text" id="key-addon">Key</span>
                <input type="text" className="form-control" placeholder="target" aria-label="Key" aria-describedby="key-addon" onChange={updateKeyField} />
            </div>
        </div>
    )

    // Download file
    const downloadFile = async (filename) => {
        try {
            var file = await downloadExampleFiles(filename)
            var url = window.URL.createObjectURL(file)
            var anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            anchor.target = "_blank";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        }
        catch (error) {
            console.error(error)
        }
    }

    // Download example files
    const downloadExamples = () => {
        downloadFile("predictions.txt")
        downloadFile("references.txt")
    }

    // Download computed scores as json file
    const downloadScores = () => {
        var dataString = JSON.stringify(scores)
        var data = "data:text/json;charset=utf-8," + encodeURIComponent(dataString);
        var anchor = document.createElement('a');
        anchor.href = data;
        anchor.download = "evaluation.json";
        anchor.target = "_blank";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }


    return (
        <>
            <div className="container-flex rounded py-5 px-3 ">

                <div className="container-lg rounded text-white my-2 mb-4" style={{ backgroundColor: "#004B23" }}>

                    <div className="container py-3 px-3">
                        <h3>Summary Evaluation</h3>
                    </div>

                    <div className="container py-3 px-3 mt-3">
                        <h5 className="lead">How to evaluate summaries:</h5>
                        <ol>
                            <li>Upload generated summaries as a text file with one summary per line (as "Predictions").</li>
                            <li>Upload the summaries that should be used as references either as a text file with one summary per line or as json or jsonl file (as "References").
                                In case of json and jsonl files, the name of the key containing the references is required to be inserted in the additional input field that opens as soon as the upload of a json or jsonl file is detected.</li>
                            <li>Select one or multiple of the offered scores.</li>
                            <li>Press the "Evaluate" button to start the evaluation process. Depending on the number of samples and the used metrics this can take several seconds.
                                Computation of METEOR and BERTScore can require up to a few minutes.
                            </li>
                        </ol>
                    </div>

                </div>
                <div className="container-lg rounded bg-dark text-white my-2 mb-4 pt-3">

                    <div className="d-flex ">
                        <button className="btn btn-outline-primary" style={{ marginLeft: "auto" }} onClick={downloadExamples}>
                            <i className="fas fa-file-download"></i> Download Example files
                        </button>
                    </div>

                    <hr className="custom-sep" />

                    <div className="container py-3 px-3 mt-3">
                        <div className="row">
                            <div className="col-6">
                                <label className="form-label mt-1" htmlFor="inputFile">Upload predictions</label>
                                <div className="input-group mb-3">
                                    <input type="file" className="form-control" id="inputFile" aria-describedby="inputGroupFileAddon" aria-label="Upload" onChange={uploadPreds} />
                                    <label className="input-group-text" type="button" id="inputGroupFileAddon">Upload text files</label>
                                </div>
                            </div>
                            <div className="col-6">
                                <label className="form-label mt-1" htmlFor="inputFile">Upload references</label>
                                <div className="input-group mb-3">
                                    <input type="file" className="form-control" id="inputFile" aria-describedby="inputGroupFileAddon" aria-label="Upload" onChange={uploadRefs} />
                                    <label className="input-group-text" type="button" id="inputGroupFileAddon">Upload text files</label>
                                </div>
                            </div>
                        </div>

                        {showKeyField ? keyInput : ""}

                    </div>

                    <hr className="custom-sep" />

                    <SelectEvaluation setSelectedMetrics={getSelectedMetrics} />

                    <div className="container py-3 px-3 mt-3">

                        <div className="d-grid gap-2">
                            <button className="btn btn-primary mt-3" onClick={evaluate}>Evaluate</button>
                        </div>

                    </div>

                    <div className="container pb-2">

                        {consoleView !== "" ? consolas : ""}

                        {errorAlert !== "" ? alertObject : ""}

                    </div>
                    {scores.length === 0 ? "" : (<div className="container py-4">
                        <h5>Evaluation scores:</h5>
                        <div className="container bg-light rounded d-flex justify-content-center">
                            <table className="table table-light table-sm mt-3" style={{ border: "1px solid black" }}>
                                <tbody>
                                    {scores.map(score => (
                                        Object.keys(score).includes("rouge") ? (
                                            <tr>
                                                <th scope="row">ROUGE scores:</th>
                                                {Object.keys(score.rouge).includes("max") ? (
                                                    <td>
                                                        <table className="table table-light table-sm">
                                                            <tbody>
                                                                <tr>
                                                                    <th>Rouge1 Max</th>
                                                                    <td>{Math.round(score.rouge.max.rouge_1 * 1000000) / 10000}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Rouge2 Max</th>
                                                                    <td>{Math.round(score.rouge.max.rouge_2 * 1000000) / 10000}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>RougeL Max</th>
                                                                    <td>{Math.round(score.rouge.max.rouge_L * 1000000) / 10000}</td>
                                                                </tr>
                                                            </tbody>
                                                            <tbody>
                                                                <tr>
                                                                    <th>Rouge1 Mean</th>
                                                                    <td>{Math.round(score.rouge.mean.rouge_1 * 1000000) / 10000}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Rouge2 Mean</th>
                                                                    <td>{Math.round(score.rouge.mean.rouge_2 * 1000000) / 10000}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>RougeL Mean</th>
                                                                    <td>{Math.round(score.rouge.mean.rouge_L * 1000000) / 10000}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                ) : (
                                                    <td>
                                                        <table className="table table-light table-sm">
                                                            <tbody>
                                                                <tr>
                                                                    <th>Rouge1</th>
                                                                    <td>{Math.round(score.rouge.rouge_1 * 1000000) / 10000}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Rouge2</th>
                                                                    <td>{Math.round(score.rouge.rouge_2 * 1000000) / 10000}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>RougeL</th>
                                                                    <td>{Math.round(score.rouge.rouge_L * 1000000) / 10000}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>)}
                                            </tr>) : <></>
                                    ))}
                                    {scores.map(score => (
                                        Object.keys(score).includes("bleu") ? (<tr>
                                            <th scope="row">BLEU score:</th>
                                            <td className="align-right">{Math.round(score.bleu * 10000) / 10000}</td>
                                        </tr>) : <></>
                                    ))}
                                    {scores.map(score => (
                                        Object.keys(score).includes("meteor") ? (
                                            Object.keys(score.meteor).includes("max") ? (
                                                <tr>
                                                    <th scope="row">METEOR scores:</th>
                                                    <td>
                                                        <table className="table table-light table-sm">
                                                            <tbody>
                                                                <tr>
                                                                    <th>Mean</th>
                                                                    <td>{Math.round(score.meteor.mean * 1000000) / 10000}</td>
                                                                </tr>
                                                                <tr>
                                                                    <th>Max</th>
                                                                    <td>{Math.round(score.meteor.max * 1000000) / 10000}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <th scope="row">METEOR score:</th>
                                                    <td className="align-right">{Math.round(score.meteor * 1000000) / 10000}</td>
                                                </tr>
                                            )
                                        ) : ""
                                    ))}
                                    {scores.map(score => (
                                        Object.keys(score).includes("bert_score") ? (<tr>
                                            <th scope="row">BERTScore:</th>
                                            <td className="align-right">{Math.round(score.bert_score.f1_score * 1000000) / 10000}</td>
                                        </tr>) : <></>
                                    ))}


                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex">
                            <small style={{ marginTop: "1vh" }}>All above provided scores are multiplicated by factor 100. Downloaded scores are not resized.</small>
                            <button className="btn btn-light" style={{ marginLeft: "auto", marginBottom: 1, marginTop: "1vh" }} onClick={downloadScores}>
                                <i className="fas fa-file-download"></i> Download
                            </button>
                        </div>

                    </div>)}

                </div>
            </div>

        </>
    )
}
// {evaluation.length !== 0 ? (<EvaluationScores evaluation={JSON.parse(evaluation)} />) : ""}
export default Evaluation
