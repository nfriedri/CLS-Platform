import React from 'react'
import banner from "./../resources/banner.png"

/*
Footer component
Basic information about the project and most relevant references
*/

const Footer = () => {
    return (
        <footer className="container-fluid mt-5 ">
            <hr className="my-5" style={{ borderColor: "#222E58" }} />

            <div className="row">
                <div className="col-3 col-md">
                    <img src={banner} alt="University of Mannheim" width="40%" />
                    <ul className="list-unstyled text-small">
                        <li className="list-unstyled text-small">
                            <a className="link text-muted ml-4" target="_blank" href="https://www.uni-mannheim.de" rel="noreferrer" >University of Mannheim</a>
                        </li>
                        <small className="d-block mb-3 ml-4 text-muted">&copy; 2022</small>
                    </ul>
                </div>
                <div className="col-3 col-md">
                    <h5 style={{ color: "#222E58" }}>About</h5>
                    <ul className="list-unstyled text-small">
                        <li><a className="text-muted" target="_blank" href={process.env.REACT_APP_BACKEND_URL + "/swagger"}>API documentation</a></li>
                        <li><a className="text-muted" target="_blank" href="https://arxiv.org/pdf/1912.08777.pdf" rel="noreferrer">Pegasus</a> </li>
                        <li><a className="text-muted" target="_blank" href="https://aclanthology.org/2020.acl-main.703/" rel="noreferrer">BART</a> <a className="text-muted" target="_blank" href="https://arxiv.org/pdf/2001.08210.pdf" rel="noreferrer" >mBART</a></li>

                    </ul>
                </div>
                <div className="col-3 col-md">
                    <h5 style={{ color: "#222E58" }}>Dependencies</h5>
                    <ul className="list-unstyled text-small">
                        <li><a className="text-muted" target="_blank" href="https://aclanthology.org/2020.findings-emnlp.428/" rel="noreferrer" >TLDR: Extreme Summarization of Scientific Documents</a></li>
                        <li><a className="text-muted" target="_blank" href="https://huggingface.co/" rel="noreferrer" >Huggingface</a></li>
                        <li><a className="text-muted" target="_blank" href="https://www.pytorchlightning.ai/" rel="noreferrer" >PyTorch Lightning</a></li>
                    </ul>
                </div>
                <div className="col-3 col-md">
                    <h5 style={{ color: "#222E58" }}>Impressum</h5>
                    <ul className="list-unstyled text-small">
                        <li className="text-muted">Created by Niklas Friedrich</li>
                        <li><a className="text-muted" target="_blank" href="https://www.uni-mannheim.de/dws/" rel="noreferrer" >Data and Web Science Group</a></li>
                        <li><a className="text-muted" target="_blank" href="https://www.uni-mannheim.de" rel="noreferrer" >University of Mannheim</a></li>
                    </ul>
                </div>
            </div>
        </footer >
    )
}

export default Footer
