import logging
from flask_socketio import send, emit
from summarization.blueprint import summarizer
from summarization.cross_lingual_bp import cross_lingual_summarization, lang_to_model
import json
import traceback


def summarize(data):
    model = data["model"]
    truncation = data["truncation"]
    huggingface = data["huggingface"]
    text = data["text"].strip()
    emit("loading", f"Connected. Loading model: {model}.")
    try:
        summarization = summarizer.summarize(
            model, text, truncation=truncation, huggingface=huggingface, socket_connection=True)
        emit('summarization', summarization)
    except:
        logging.error(traceback.format_exc())
        emit('error', f"ERROR")


def cascading_summarize(data):
    model = data["model"]
    text = data["text"].strip()
    huggingface = data["huggingface"]
    emit("loading", f"Connected. Loading model: {model}.")
    try:
        summarization = summarizer.cascading_summarization(
            model, text, huggingface=huggingface, socket_connection=True)
        emit('summarization', summarization)
    except:
        logging.error(traceback.format_exc())
        emit('error', f"ERROR")


def cross_lingual_summarize(data):
    text = data["text"]
    tgt_lang = data["tgt_lang"]
    model_name, tgt_lang = lang_to_model(tgt_lang)
    emit("loading", f"Connected. Loading model for {tgt_lang}.")
    try:
        summary = summarizer.summarize(
            model_name, text, truncation=True, socket_connection=True, tgt_lang=tgt_lang)
        emit('summarization', summary)
    except:
        logging.error(traceback.format_exc())
        emit('error', f"ERROR")
