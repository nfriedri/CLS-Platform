import logging
import json
import os
from socket import socket

from flask import Blueprint, request
from evaluation.evaluate import Evaluate
from environment import (UPLOAD_DIR)

import uuid

# from evaluation.cal_rouge import cal_rouge

evaluate_bp = Blueprint('evaluate_bp', __name__)

evaluation = Evaluate()


# Get available metrics
@evaluate_bp.route("/metrics", methods=["GET"])
def get_evaluation_methods():
    metrics = evaluation.get_metrics()
    logging.info(f"Available metrics: {metrics}")
    return json.dumps(metrics)


# Upload evaluation-files for socket connection based evaluation
@evaluate_bp.route("/evaluation-files", methods=["POST"])
def upload_evaluation_files():
    try:
        prediction_file = ""
        reference_file = ""
        if "predictions" in request.files:
            file = request.files["predictions"]
            file_ending = file.filename.split(".")[-1]
            file_name = str(uuid.uuid4()) + file_ending
            file_path = os.path.join(UPLOAD_DIR, file_name)
            file.save(file_path)
            prediction_file = file_name
        if "references" in request.files:
            file = request.files["references"]
            file_ending = file.filename.split(".")[-1]
            file_name = f"{uuid.uuid4()}.{file_ending}"
            file_path = os.path.join(UPLOAD_DIR, file_name)
            file.save(file_path)
            reference_file = file_name
        return {"prediction_file": prediction_file, "reference_file": reference_file}
    except:
        return "ERROR"


# Evaluate by uploading files directly
@evaluate_bp.route("/evaluate", methods=["POST"])
def evaluate():
    predictions = []
    references = []
    metrics = []
    ref_key = "target"
    sockets = False
    if "metric" in request.form:
        metrics = request.form.get("metric")
    if "ref_key" in request.form:
        ref_key = request.form.get("ref_key")
    if "sockets" in request.form:
        sockets = request.form.get("sockets")
    if "predictions" in request.files:
        file = request.files["predictions"]
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        file.save(file_path)
        predictions = open(file_path, "r", encoding="utf-8").readlines()
        try:
            os.remove(file_path)
        except OSError:
            pass
    if "references" in request.files:
        file = request.files["references"]
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        file.save(file_path)
        if file.filename.split('.')[-1] == 'jsonl':
            logging.info("References are in JSONL format.")
            lines = open(file_path, "r", encoding="utf-8").readlines()
            identifier = ref_key
            references = []
            for line in lines:
                references.append(json.loads(line)[identifier])
        elif file.filename.split('.')[-1] == '.json':
            logging.info("References are in JSON format.")
            lines = open(file_path, "r", encoding="utf-8")
            json.load(lines)
        else:
            lines = open(file_path, "r", encoding="utf-8").readlines()
            references = lines
            references = clean_text_lists(references)
        try:
            os.remove(file_path)
        except OSError:
            pass
    logging.info(
        f"Evaluating predictions and references with metrics: {metrics}")
    scores = evaluation.evaluate(
        metrics, predictions, references, socket_connection=sockets)
    logging.info(f"Scores: {scores}")
    return json.dumps(scores)


# Remove line splits from text arrays.
def clean_text_lists(text_data):
    outputs = []
    for ele in text_data:
        if ele != '':
            ele = ele.replace("\n", "").replace("\r", "")
            outputs.append(ele)
    return outputs
