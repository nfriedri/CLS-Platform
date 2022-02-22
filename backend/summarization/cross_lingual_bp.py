import logging
import json
from flask import Blueprint, request
from torch._C import Value

# from summarization.summarizer import Summarizer
from summarization.blueprint import summarizer
from translation.blueprint import translator

cross_lingual_bp = Blueprint('cross_lingual_bp', __name__)


@cross_lingual_bp.route("/cross-lingual/languages", methods=["GET"])
def get_languagess():
    langs = summarizer.get_cl_languages()
    logging.info(f"CL-Languages: {langs}.")
    return json.dumps(langs)


@cross_lingual_bp.route("/cross-lingual", methods=["POST"])
def cross_lingual_summarization():
    logging.info("Called cross-lingual summarization route.")
    text_data = None
    model_name = ""
    tgt_language = ""
    cascading = False
    if "tgt-lang" in request.args:
        tgt_language = request.args.get("tgt-lang").lower().replace("*", "")
    else:
        logging.error("Target language is required for model selection.")
        raise ValueError("Target language is required for model selection.")
    model_name, tgt_lang = lang_to_model(tgt_language)
    if "cascading" in request.args:
        cascading = request.args.get("cascading")
    if "text" in request.json:
        text_data = request.json["text"]
    else:
        logging.error("No input text provided.")
        raise ValueError("No input text provided.")

    summary = None
    if not cascading:
        summary = summarizer.summarize(
            model_name, text_data, True, False, "en_XX", tgt_lang)
    else:
        summary = summarizer.cascading_summarization(
            f"mbart-tldr-{tgt_lang}", text_data
        )
    logging.info(f"TLDR output: {summary}")
    return json.dumps({"output": summary})


def lang_to_model(tgt_lang):
    if tgt_lang == "german":
        return "mbart-tldr-german", "de_DE"
    elif tgt_lang == "french":
        return "mbart-tldr-french", "fr_XX"
    elif tgt_lang == "italian":
        return "mbart-tldr-italian", "it_IT"
    elif tgt_lang == "spanish":
        return "mbart-tldr-spanish", "es_XX"
    elif tgt_lang == "russian":
        return "mbart-tldr-russian", "ru_RU"
    else:
        logging.error("Target language not available.")
        raise ValueError("Target language not available.")
