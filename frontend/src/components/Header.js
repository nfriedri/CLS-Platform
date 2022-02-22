//import { Link } from 'react-router-dom';
import { useHistory } from "react-router-dom";
import clsLogo from './../resources/CLS-Logo.png'

/*
Header component
Displays the navbar on top of the project
*/

const Header = () => {

    // Usage of history for forwarding to subpages using react-router
    const history = useHistory();

    const toSummarizer = () => {
        history.push('/summarization/mono-lingual');
    }

    const toEvaluation = () => {
        history.push('/evaluation');
    }

    const toCrossLingual = () => {
        history.push('/summarization/cross-lingual');
    }

    const toTranslator = () => {
        history.push('/translator');
    }

    return (
        <div className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <a href="/" className="navbar-brand d-flex align-items-center">
                    <img src={clsLogo} height="25" alt="" />
                </a>

                <ul className="navbar-nav mr-auto mt-2 mt-lg-0">
                    <li className="nav-item" onClick={toSummarizer}>
                        <a className="nav-link" style={{ cursor: "pointer" }} >Summarization </a>
                    </li>
                    <li className="nav-item" onClick={toCrossLingual}>
                        <a className="nav-link" style={{ cursor: "pointer" }} >CL-TLDRs</a>
                    </li>
                    <li className="nav-item" onClick={toTranslator}>
                        <a className="nav-link" style={{ cursor: "pointer" }} >Translation</a>
                    </li>
                    <li className="nav-item" onClick={toEvaluation}>
                        <a className="nav-link" style={{ cursor: "pointer" }} >Evaluation</a>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default Header
