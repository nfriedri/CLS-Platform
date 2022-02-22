import logging
import json
import traceback

from tika import language
from flask import Blueprint, abort, request
from translation.translator import Translator
from environment import LANGUAGES_PRESENTED

translator_bp = Blueprint('translator_bp', __name__)

translator = Translator()


@translator_bp.route("/translate/languages", methods=["GET"])
def get_accepted_languages():
    return json.dumps(LANGUAGES_PRESENTED)


@translator_bp.route("/translate", methods=["POST"])
def translate():
    logging.info("Called translation route")
    text_data = ""
    opus = False
    tgt_language = ""
    if "opus" in request.args:
        opus = request.args.get("opus")
    if "tgt-lang" in request.args:
        tgt_language = request.args.get("tgt-lang")
    if "text" in request.json:
        text_data = request.json["text"]
        src_lang = language.from_buffer(text_data)

    try:
        translation = translator.translate(
            opus, text_data, src_lang, tgt_language)
        return json.dumps({"output": translation})
    except IndexError:
        translation = translator.batch_translation(text_data)
        logging.debug(f"RETURNING: {translation}")
        return json.dumps({"cascaded": True, "output": translation})
    except:
        logging.error(traceback.format_exc())
        return abort(500)
