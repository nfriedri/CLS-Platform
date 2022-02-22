import traceback
import logging
from tika import language
from flask_socketio import send, emit
from translation.blueprint import translator


def translate(data):
    text = data["text"]
    opus = data["opus"]
    tgt_lang = data["tgt-lang"]
    if opus:
        emit("loading", f"Connected to translator. Loading Opus translation model")
    else:
        emit("loading", f"Connected to translator. Loading mBART-Large 50 translation model")
    try:
        src_lang = language.from_buffer(text)
        translation = translator.batch_translation(
            text, opus, src_lang, tgt_lang, socket_connection=True)
        emit('translation', translation)
    except IndexError:
        emit('loading', "Switched to batch translation")
        translation = translator.batch_translation(
            text, socket_connection=True)
        emit('translation', translation)
    except:
        logging.error(traceback.format_exc())
        emit('error', f"ERROR")
