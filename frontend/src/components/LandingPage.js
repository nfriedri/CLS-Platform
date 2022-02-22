import { useHistory } from "react-router-dom";
import wave from "./../resources/wave.png"
import clsIcon from "./../resources/cls-icon.png"

/*
LandingPage component
Enable navigation via large button containers
*/

const LandingPage = () => {

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
        <div className="container-fluid px-0" >

            <img src={wave} alt="background-wave" style={{ height: '20vh', width: '100%' }} />

            <div className="row mt-5 pt-3">
                <div className="col-lg-6 col-md-8 mx-auto">
                    <img src={clsIcon} alt="CLS" style={{ width: "10vh" }} />
                </div>
            </div>

            <div className="row mb-5 py-5">
                <div className="col-lg-6 col-md-8 mx-auto">
                    <h1 className="fw-light">Cross-Lingual Summarization Platform </h1>
                    <p className="lead text-muted">
                        Welcome to the Cross-Lingual Summarization Platform. This platform has been build in terms of the Master Thesis of Niklas Friedrich at the Chair of Information Systems III: Enterprise Data Analysis, supervised by Prof. Dr. Simone Paolo Ponzetto.
                    </p>
                </div>
            </div>
            <div className="row px-5">
                <div className="col-6">
                    <div>
                        <div className="container-fluid rounded text-white py-4 toggleable" type="button" onClick={toSummarizer} style={{ backgroundColor: '#38B000' }}>
                            <p className="lead">Monolingual Summarization</p>
                        </div>

                        <div className="container-fluid rounded text-white py-4 toggleable" type="button" onClick={toCrossLingual} style={{ backgroundColor: '#008000' }}>
                            <p className="lead">Cross-Lingual TLDR Generation</p>
                        </div>
                        <div className="container-fluid rounded text-white py-4 toggleable" type="button" onClick={toTranslator} style={{ backgroundColor: '#006400' }}>
                            <p className="lead">Machine Translation</p>
                        </div>
                    </div>

                </div>
                <div className="col-6">
                    <div className="container-fluid rounded text-white py-5 toggleable" type="button" onClick={toEvaluation} style={{ backgroundColor: '#004B23' }}>
                        <br />
                        <br />
                        <br />
                        <p className="lead">Summary Evaluation</p>
                        <br />
                        <br />
                        <br />
                    </div>
                </div>

            </div>

            <div className="mt-5 px-5 mx-5">
                <p style={{ textAlign: "justify" }}>The CLS Platform is able to summarize monolingual articles and documents using latest state-of-the-art natural language processing technologies.
                    Additionally, unique pre-trained mBART models for Cross-Lingual TLDR Generation are offered.
                    A module offering machine-translation via transformer-based models is added to parallel enable users to perform the same cross-lingual tasks via pipeline approaches.
                    Furthermore, generated summaries and TLDRs can be evaluated against reference summaries using summarization and machine-translation metrics.
                    The platform is designed to be as easily extendable as possible. For details on extending the platform, please see the corresponding Master thesis by Niklas Friedrich.
                    It is offered as a web-application hosted at: <a href="wifo5-38.informatik.uni-mannheim.de"> the university's server</a> or as a desktop ported application.
                    Due to performance reasons, it is recommended to use the desktop version.
                    The detailed API documentation can be accessed <a href={process.env.REACT_APP_BACKEND_URL + "/swagger"}>here</a>.
                    All used model are based on the Transformer architecture by <a href="https://arxiv.org/pdf/1706.03762.pdf">Vaswani et al</a>
                </p>
            </div>
        </div >
    )
}

export default LandingPage
