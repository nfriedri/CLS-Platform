import React from 'react';
import { useState, useEffect } from 'react';
import { requestMetrics } from './../requests/evaluation.requests';

/*
Select evaluation metrics
Enables users to select metrics. Sub-component of Evaluation
*/

const SelectEvaluation = ({ setSelectedMetrics }) => {

    // State variables
    const [metrics, setMetrics] = useState([])
    const [metricsData, setMetricsData] = useState({ "": { "description": "", "url": "" } })
    const [selectedMetricsList, setSelectedMetricsList] = useState([])

    // Request on page load
    useEffect(() => {
        getMetrics();
    }, []);

    // Request available metrics
    const getMetrics = async () => {
        requestMetrics()
            .then((data) => {
                //console.log(data)
                setMetrics(Object.keys(data))
                setMetricsData(data)

            })
            .catch((error) => {
                console.error(error);
            });
    };

    // Select a metric by click
    const metricClick = (ev) => {
        //console.log(ev.target.value)
        var metricListCopy = selectedMetricsList;
        if (metricListCopy.includes(ev.target.value)) {
            var index = metricListCopy.indexOf(ev.target.value)
            metricListCopy.splice(index, 1)
        }
        else {
            metricListCopy.push(ev.target.value)
        }
        setSelectedMetricsList(selectedMetricsList => (selectedMetricsList = metricListCopy))
        setSelectedMetrics(metricListCopy)
        //console.log(selectedMetricsList)
    }

    // Display information about metrics
    const metricInfo = (
        <div className="container mt-4">
            <h6>Metrics information:</h6>
            <table className="table text-white">
                <tbody>
                    {Object.keys(metricsData).map((metric, index) => (

                        <tr>
                            <th scope='row'>{metric}</th>
                            <td>{metricsData[metric].description}</td>
                            <td><a href={metricsData[metric].url}>Link</a></td>
                        </tr>

                    ))}

                </tbody>
            </table>

        </div>
    )


    return (
        <div className="container rounded py-3 px-3 mt-4 bg-dark text-light">

            <h4>Select model</h4>

            <div className="row mt-4">
                <label className="form-label">Select target languages: </label>
                <div className="btn-group row row-cols-6" role="group" aria-label="Basic radio toggle button group" onChange={metricClick} style={{ marginLeft: 1 }}>

                    {metrics.map((metric, index) => (<>
                        <input type="checkbox" className="btn-check" name="checkpointRadio" id={`checkpointRadio${index}`} value={metric} />
                        <label className="btn btn-outline-color2" data-bs-toggle="tooltip" data-bs-placement="bottom" title={metric} htmlFor={`checkpointRadio${index}`}>{metric}</label>
                    </>
                    ))}

                </div>
            </div>

            {metricInfo}

        </div>
    )
}

//<p>${metricsData.metric.description} <small><a href={metricsData.metric.url}>Paper.</a></small></p>

export default SelectEvaluation
