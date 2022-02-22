import React from 'react';
import { useState, useEffect } from 'react';
import { requestCheckpoints } from './../requests/summary.requests';

/*
Select model for summarization
Enables users to select one of the displayed models or alternatively enter a hf id for new models if in DESKTOP mode
Sub-component of Summarizer component
*/

const SelectModel = ({ setModelCheckpoint, setTruncationValue, setAlternativeValue }) => {

    // State values
    const [selectedModel, setSelectedModel] = useState("");
    const [selectedCheckpoint, setSelectedCheckpoint] = useState("");
    const [alternative, setAlternative] = useState(false)

    const [checkpointData, setCheckpointData] = useState({ "": { "description": "", "url": "", "max-token-length": 0 } });
    const [checkpoints, setCheckpoints] = useState([])
    const [truncation, setTruncation] = useState(false)

    const [description, setDescription] = useState("")
    const [modelURL, setModelURL] = useState("")
    const [maxTokenLength, setMaxTokenLength] = useState(0)


    // Request on page load
    useEffect(() => {
        getCheckpoints();
    }, []);

    // Select alternative model via huggingface
    const selectAlternative = () => {
        if (!alternative === true) {
            setSelectedCheckpoint("sshleifer/distilbart-cnn-12-6");
            setModelCheckpoint("sshleifer/distilbart-cnn-12-6");
        }
        setAlternative(!alternative)
        setAlternativeValue(!alternative)
    }

    // Enable/disable truncation via switch btn
    const selectTruncation = () => {
        setTruncation(!truncation)
        setTruncationValue(!truncation)
    }

    // Retrieve available checkpoint data 
    const getCheckpoints = () => {
        requestCheckpoints()
            .then((data) => {
                setCheckpoints(Object.keys(data))
                setCheckpointData(data)
            })
            .catch((error) => {
                console.error(error);
            });
    };

    // Select checkpoint on-click
    const checkpointClick = (ev) => {
        //console.log(ev.target.value)
        setSelectedCheckpoint(ev.target.value)
        setModelCheckpoint(ev.target.value)
        setDescription(checkpointData[ev.target.value].description)
        setModelURL(checkpointData[ev.target.value].url)
        setMaxTokenLength(checkpointData[ev.target.value]["max-token-length"])
    }

    // Update the checkpoint identifier
    const updateIdentifier = (ev) => {
        setSelectedCheckpoint(ev.target.value);
        setModelCheckpoint(ev.target.value);
    }

    // Display model info of selected checkpoint
    const modelInfo = (
        <div className="container mt-4"  >
            <h6>Model information:</h6>
            <p>{description} <small><a href={modelURL}>Paper.</a></small></p>
            <p>Maximum accepted length of tokens: {maxTokenLength}</p>

        </div>
    )


    return (
        <div className="container rounded py-3 px-3 mt-4 bg-dark text-light">

            <h4>Select model</h4>

            <div className="row mt-4">
                <div className="btn-group row row-cols-4" role="group" aria-label="Basic radio toggle button group" onChange={checkpointClick} style={{ marginLeft: 1 }}>

                    {checkpoints.map((checkpoint, index) => (<>
                        <input type="radio" className="btn-check" name="checkpointRadio" id={`checkpointRadio${index}`} value={checkpoint} />
                        <label className="btn btn-outline-color5" htmlFor={`checkpointRadio${index}`}>{checkpoint}</label>
                    </>
                    ))}

                </div>
            </div>

            <div className="row mt-4" style={{ marginLeft: "1vh" }}>
                <div className="col-3">
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" role="switch" id="switchTruncation" onChange={selectTruncation} />
                        <label className="form-check-label" htmlFor="switchTruncation">Enable truncation</label>
                    </div>
                </div>
                {process.env.REACT_APP_ENVIRONMENT === "DESKTOP" ? (
                    <>
                        <div className="col-4">
                            <div className="input-gorup">

                                <label className="form-label mt-1" htmlFor="inputFile" > Alternatively enter huggingface identifier:</label>
                                <input type="checkbox" className="btn-check" name="checkpointBox" id="use-alternative" />
                                <label className="btn btn-outline-color5" htmlFor="use-alternative" style={{ marginLeft: "1vh" }} onClick={selectAlternative}>Select</label>
                            </div>
                        </div>
                        {alternative ? (<div className="col-5">

                            <div>

                                <div className="input-group mb-3">
                                    <input type="text" className="form-control" placeholder="sshleifer/distilbart-cnn-12-6" aria-label="Key" aria-describedby="key-addon" onChange={updateIdentifier} />
                                </div>

                            </div>
                        </div>) : ""}
                    </>
                ) : ""}
            </div>
            {alternative ? (
                <div className="row" style={{ marginLeft: "1vh" }}>
                    <div className="col-3"></div>
                    <div className="col-9">
                        <small>Requires to download the specified model to the default cache directory. Depending on internet connection speed, this may take several minutes.</small>
                    </div>
                </div>
            ) : (<></>)}

            <div className="row mt-4">
                {modelURL !== "" ? modelInfo : ""}
            </div>

        </div>
    )
}


export default SelectModel
