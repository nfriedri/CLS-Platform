import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/brands';
import '@fortawesome/fontawesome-free/js/solid';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import Summarizer from './components/Summarizer';
import Evaluation from './components/Evaluation';
import CrossLingual from './components/CrossLingual';
import Translator from './components/Translator';
import Footer from './components/Footer';

function App() {

  return (
    <Router>
      <div className="App">
        <Header />
        <Route path='/' exact component={LandingPage} />
        <Route path='/summarization/mono-lingual' component={Summarizer} />
        <Route path='/evaluation' component={Evaluation} />
        <Route path='/summarization/cross-lingual' component={CrossLingual} />
        <Route path='/translator' component={Translator} />
        <Footer />
      </div>
    </Router>
  );
}

export default App;
