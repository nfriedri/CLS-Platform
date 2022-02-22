import logging
from distutils.command.clean import clean
import os
import json
from flask_socketio import send, emit
from flask import request
from environment import UPLOAD_DIR
from evaluation.evaluate import Evaluate

import numpy as np


tmp_saved_files = []
eval = Evaluate()


# Evaluate ref & pred files that have been uploaded before via REST file upload
def evaluate(data):
    metrics = data["metrics"]
    ref_file_name = data["reference_filename"]
    pred_file_name = data["prediction_filename"]
    logging.info(
        f"Evaluating predictions {pred_file_name} and references {ref_file_name} with the metrics: {metrics}")

    try:
        predictions = open(os.path.join(
            UPLOAD_DIR, pred_file_name), "r", encoding="utf-8").readlines()
        predictions = clean_text_lists(predictions)
        os.remove(os.path.join(UPLOAD_DIR, pred_file_name))
    except OSError:
        os.remove(os.path.join(UPLOAD_DIR, pred_file_name))
        pass
    try:
        reference_file = os.path.join(UPLOAD_DIR, ref_file_name)
        if ref_file_name.split('.')[-1] == 'jsonl':
            logging.info("Reference file is JSONL file.")
            lines = open(reference_file, "r", encoding="utf-8").readlines()
            identifier = data["ref_key"]
            references = []
            for line in lines:
                references.append(json.loads(line)[identifier])
        elif reference_file.split('.')[-1] == '.json':
            logging.info("Reference file is JSON file.")
            lines = open(reference_file, "r", encoding="utf-8")
            json.load(lines)
        else:
            lines = open(reference_file, "r", encoding="utf-8").readlines()
            references = lines
            references = clean_text_lists(references)
        os.remove(reference_file)
    except OSError:
        pass

    emit("loading", f"Parsed input data successfully. Now starting evaluation...")
    output = eval.evaluate(metrics, predictions,
                           references, socket_connection=True)
    response = {"scores": output}
    logging.info(f"Returning scores: {response}")
    emit("evaluation-scores", response)


# Save a file temporary
def temp_save_file(file_name, content):
    with open(os.path.join(UPLOAD_DIR, file_name), "wb") as file:
        file.write((content.decode("utf-8")))


# Remove line breaks from array
def clean_text_lists(text_data):
    outputs = []
    for ele in text_data:
        if ele != '':
            ele = ele.replace("\n", "").replace("\r", "")
            outputs.append(ele)
    return outputs


# Transform a json element into a list of elements of the specified key value
def json_to_list(text_data, key):
    outputs = []
    text_data = text_data.replace("\r", "\n")
    text_split = text_data.split("\n")
    lines = []
    for ele in text_split:
        if ele != '':
            lines.append(ele)
    for line in lines:
        data = json.loads(line)
        try:
            outputs.append(data[key])
        except KeyError:
            emit("loading", "Key error - Please check the correctness of the input key")
            pass
    return outputs
