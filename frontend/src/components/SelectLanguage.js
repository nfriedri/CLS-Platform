import React from 'react';
import { useState, useEffect } from 'react';
import { requestLanguages } from './../requests/translator.requests';

/*
Select Language component
Enables users to select the required target language.
Sub-component of the Translation component
*/

const SelectLanguage = ({ setTargetLanguage, setOpusValue }) => {

    // State variables
    const [selectedLanguage, setSelectedLanguage] = useState("");

    const [languages, setLanguages] = useState([])
    const [opus, setOpus] = useState(false)

    // Request performed on page load
    useEffect(() => {
        getLanguages();
    }, []);

    // Enable/disable opus via switch btn
    const selectOpus = () => {
        setOpus(!opus)
        setOpusValue(!opus)
    }

    // Request available languages
    const getLanguages = () => {
        requestLanguages()
            .then((data) => {
                setLanguages(data)
            })
            .catch((error) => {
                console.error(error);
            });
    };

    // Select clicked-on language
    const languageClick = (ev) => {
        //console.log(ev.target.value)
        setSelectedLanguage(ev.target.value)
        setTargetLanguage(ev.target.value)
    }

    return (
        <div className="container rounded py-3 px-3 mt-4 bg-dark text-light">

            <h4>Select model</h4>

            <div className="row mt-4">
                <label className="form-label">Select target languages: </label>
                <div className="btn-group row row-cols-6" role="group" aria-label="Basic radio toggle button group" onChange={languageClick} style={{ marginLeft: 1 }}>

                    {languages.map((language, index) => (<>
                        <input type="radio" className="btn-check" name="checkpointRadio" id={`checkpointRadio${index}`} value={language} />
                        <label className="btn btn-outline-color2" htmlFor={`checkpointRadio${index}`}>{language}</label>
                    </>
                    ))}

                </div>
            </div>

            {process.env.REACT_APP_ENVIRONMENT === "DESKTOP" ? (
                <div className="row mt-4" style={{ marginLeft: "1vh" }}>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" role="switch" id="switchOpus" onChange={selectOpus} />
                        <label className="form-check-label" htmlFor="switchOpus">Use opus translation models instead of mBART50</label>
                    </div>
                </div>) : (<></>)}

        </div>
    )
}


export default SelectLanguage
