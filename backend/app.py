import evaluation.sockets as evaluation_socket
import summarization.sockets as summarization
import translation.sockets as translation
from utils.blueprint import utils_bp
from translation.blueprint import translator_bp
from evaluation.blueprint import evaluate_bp
from summarization.cross_lingual_bp import cross_lingual_bp
from summarization.blueprint import summarizer_bp
from flask import Flask, render_template
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from environment import (DESKTOP, HOST, PORT, UPLOAD_DIR)
import logging
import sys
import os
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from tika import language
from flask_swagger_ui import get_swaggerui_blueprint


""" Initialize logging """
from logging.config import dictConfig
dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        'datefmt': '%Y-%m-%d %H:%M:%S'
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

"""Start App"""
print("\033[96m")
print("""
_________________________________________________________________________________________________________

     ██████╗██╗     ███████╗    ██████╗ ██╗      █████╗ ████████╗███████╗ ██████╗ ██████╗ ███╗   ███╗
    ██╔════╝██║     ██╔════╝    ██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗████╗ ████║
    ██║     ██║     ███████╗    ██████╔╝██║     ███████║   ██║   █████╗  ██║   ██║██████╔╝██╔████╔██║
    ██║     ██║     ╚════██║    ██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║
    ╚██████╗███████╗███████║    ██║     ███████╗██║  ██║   ██║   ██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║
     ╚═════╝╚══════╝╚══════╝    ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝                                                                                                             
_________________________________________________________________________________________________________
""")
print("\033[0m")

if DESKTOP:
    app = Flask(__name__, static_folder="build-desktop/static",
                template_folder="build-desktop")
else:
    app = Flask(__name__, static_folder="build-server/static",
                template_folder="build-server")
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_DIR
app.config['SECRET_KEY'] = 'secret!'

if not DESKTOP:
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * \
        1024  # Limit Max upload fle size to 16MB


"""Swagger UI Configuration"""
SWAGGER_URL = '/swagger'
API_URL = '/static/swagger.json'
SWAGGERUI_BLUEPRINT = get_swaggerui_blueprint(
    SWAGGER_URL, API_URL, config={'app_name': "CLS Platform"})
app.register_blueprint(SWAGGERUI_BLUEPRINT, url_prefix=SWAGGER_URL)

# Register Blueprints
app.register_blueprint(summarizer_bp)
app.register_blueprint(cross_lingual_bp)
app.register_blueprint(evaluate_bp)
app.register_blueprint(translator_bp)
app.register_blueprint(utils_bp)

# Start Tika server with simple request
language.from_buffer("This is a simple request to start the server.")

# Register app to socket connection
socketio = SocketIO(app, cors_allowed_origins='*',
                    async_handlers=True, async_mode="threading")


@app.route("/test")
def connection_test():
    logging.info("Connection test called.")
    return "Welcome to CLS-Platform!"


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    logging.info("Rendering REACT...")
    return render_template("index.html")


@socketio.on('summarization')
def summarize(data):
    logging.info("Summarization request received via sockets.")
    summarization.summarize(data)


@socketio.on('cascading-summarization')
def summarize(data):
    logging.info("Cascading summarization request received via sockets.")
    summarization.cascading_summarize(data)


@socketio.on('cross-lingual-summarization')
def cross_lingual_summarization(data):
    logging.info("Cross-Lingual Summarization request received via sockets.")
    summarization.cross_lingual_summarize(data)


@socketio.on('translation')
def evaluation(data):
    logging.info("Translation request received via sockets.")
    translation.translate(data)


@socketio.on('evaluation')
def evaluation(data):
    logging.info("Evaluation request received via sockets.")
    evaluation_socket.evaluate(data)


def clean_tmp_uploads():
    logging.info("Cleaning TMP-UPLOADS folder on schedule")
    files = os.listdir(UPLOAD_DIR)
    for f in files:
        os.remove(os.path.join(UPLOAD_DIR, f))
    logging.info(
        f"Successfully cleaned TMP-UPLOADS folder. Removed {len(files)} files.")


'''Execute application and start GUI'''
if DESKTOP:
    # Hide Development Server Warning
    cli = sys.modules['flask.cli']
    cli.show_server_banner = lambda *x: None
    url = f"http://{HOST}:{PORT}/"

    if sys.platform == 'win32':
        os.startfile(url)
    elif sys.platform == 'darwin':
        subprocess.Popen(['open', url])
    else:
        try:
            subprocess.Popen(['xdg-open', url])
        except OSError:
            print('Please open a browser on: ' + url)

if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    clean_tmp_uploads()
    scheduler.add_job(clean_tmp_uploads, 'interval', minutes=720)
    scheduler.start()
    logging.info(f"APP: Server will run on http://{HOST}:{PORT}/")
    # app.run(host=HOST, port=PORT, debug=False)
    socketio.run(app, host=HOST, port=PORT, debug=False)
