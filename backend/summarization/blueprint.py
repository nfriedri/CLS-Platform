import logging
import json
from flask import Blueprint, request

from summarization.summarizer import Summarizer

summarizer_bp = Blueprint('summarizer_bp', __name__)

summarizer = Summarizer()


@summarizer_bp.route("/checkpoints", methods=["GET"])
def get_checkpoints():
    checkpoints = summarizer.get_checkpoints()
    logging.info(
        f"Available model checkpoints: {checkpoints}")
    return json.dumps(checkpoints)


@summarizer_bp.route("/preload", methods=["GET"])
def preload_model():
    model = None
    huggingface = False
    if "model" in request.args:
        model = request.args.get("model")
    if "huggingface" in request.args:
        huggingface = request.args.get("huggingface")
    resp = summarizer.preload_model(model_name=model, huggingface=huggingface)
    logging.info(f"Preloaded: {resp}")
    return json.dumps({"message": resp})


@summarizer_bp.route("/summarize", methods=["POST"])
def summarize():
    text_data = None
    model = ""
    huggingface = False
    tgt_lang = ""
    if "model" in request.args:
        model = request.args.get("model")
    if "text" in request.json:
        text_data = request.json["text"]
    if "huggingface" in request.args:
        huggingface = request.args.get("huggingface")
    if "tgt-lang" in request.args:
        tgt_lang = request.args.get("tgt-lang")
    if tgt_lang != "":
        summary = summarizer.summarize(model, text_data, huggingface=huggingface, tgt_lang=tgt_lang)
    else:
        summary = summarizer.summarize(model, text_data, huggingface=huggingface)
    logging.info(f"Returning summary: {summary}")
    return json.dumps({"summary": summary})


@summarizer_bp.route("/cascading-summarization", methods=["POST"])
def summarize_cascading():
    text_data = None
    model = ""
    huggingface = False
    if "model" in request.args:
        model = request.args.get("model")
    if "text" in request.json:
        text_data = request.json["text"]
    if "huggingface" in request.args:
        huggingface = request.args.get("huggingface")
    summary = summarizer.cascading_summarization(model, text_data, huggingface=huggingface)
    logging.info(f"Returning summary: {summary}")
    return json.dumps({"summary": summary})
