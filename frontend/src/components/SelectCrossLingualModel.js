import React from 'react';
import { useState, useEffect } from 'react';
import { requestLanguages } from './../requests/crossLingual.requests';

/*
Select Cross-Lingual Model component
Enables users to select the required target language.
Sub-component of the CrossLingual component
*/

const SelectCrossLingualModel = ({ setLanguageCheckpoint }) => {

    // State variable
    const [selectedCheckpoint, setSelectedCheckpoint] = useState("");

    const [checkpointData, setCheckpointData] = useState({ "": { "description": "", "url": "", "max-token-length": 0 } });
    const [checkpoints, setCheckpoints] = useState([])

    const [description, setDescription] = useState("")
    const [modelURL, setModelURL] = useState("")
    const [maxTokenLength, setMaxTokenLength] = useState(0)

    // Request needs to be executed on page load
    useEffect(() => {
        getLanguages();
    }, []);

    // Request available languages from backend
    const getLanguages = () => {
        requestLanguages()
            .then((data) => {
                setCheckpoints(Object.keys(data))
                setCheckpointData(data)
            })
            .catch((error) => {
                console.error(error);
            });
    };

    // Set all states correctly when a language is selected
    const checkpointClick = (ev) => {
        //console.log(ev.target.value)
        setSelectedCheckpoint(ev.target.value)
        setLanguageCheckpoint(ev.target.value)
        setDescription(checkpointData[ev.target.value].description)
        setModelURL(checkpointData[ev.target.value].url)
        setMaxTokenLength(checkpointData[ev.target.value]["max-token-length"])
    }

    // Display basic model informations for selected language
    const modelInfo = (
        <div className="container mt-4"  >
            <h6>Model information:</h6>
            <p>{description} <small><a href={modelURL}>Paper.</a></small></p>
            <p>Maximum accepted length of tokens: {maxTokenLength}</p>

        </div>
    )

    return (
        <div className="container rounded py-3 px-3 mt-4 bg-dark text-light">

            <h4>Select target language</h4>

            <div className="row mt-4">

                <div className="btn-group row row-cols-6" role="group" aria-label="Basic radio toggle button group" onChange={checkpointClick} style={{ marginLeft: 1 }}>

                    {checkpoints.map((checkpoint, index) => (<>
                        <input type="radio" className="btn-check" name="checkpointRadio" id={`checkpointRadio${index}`} value={checkpoint} />
                        <label className="btn btn-outline-color4" htmlFor={`checkpointRadio${index}`}>{checkpoint}</label>
                    </>
                    ))}

                </div>

            </div>

            <div className="row mt-4">
                {selectedCheckpoint !== "" ? modelInfo : ""}
            </div>

        </div>
    )
}


export default SelectCrossLingualModel
