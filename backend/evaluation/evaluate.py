import os
import logging
import json
from flask import Blueprint

from flask_socketio import emit
from datasets import load_metric
from evaluation.bleu import bleu_mean
from evaluation.rouge import rouge_mean, rouge_mean_max
from evaluation.meteor import meteor_mean, meteor_mean_max
from evaluation.bertscore import bertscore_mean
from environment import CACHE_DIR, EVALUATION_FILE

import summarization.blueprint as summarization
import translation.blueprint as translation

meteor = load_metric("meteor", cache_dir=CACHE_DIR)


# Evaluation module class
class Evaluate:
    def __init__(self):
        self.predictions = []
        self.references = []
        self.metrics = []

    def get_metrics(self):
        evaluation_file = open(EVALUATION_FILE, "r")
        metrics = json.load(evaluation_file)
        return metrics

    def evaluate_rouge(self):
        logging.info(
            f" Starting ROUGE evaluation with {len(self.predictions)} elements"
        )
        if type(self.references[0]) == type([]):
            result = rouge_mean_max(self.predictions, self.references)
        else:
            result = rouge_mean(self.predictions, self.references)
        return result

    def evaluate_bleu(self):
        logging.info(
            f"Starting BLEU evaluation with {len(self.predictions)} elements"
        )
        result = bleu_mean(self.predictions, self.references)
        return result

    def evaluate_meteor(self):
        logging.info(
            f"Starting METEOR evaluation with {len(self.predictions)} elements"
        )
        if type(self.references[0]) == type([]):
            result = meteor_mean_max(self.predictions, self.references)
        else:
            result = meteor_mean(self.predictions, self.references)
        return result

    def evaluate_bertscore(self):
        summarization.summarizer.reset_summarizer()
        translation.translator.reset_translator()
        logging.info(
            f"Starting BERTSCORE evaluation with {len(self.predictions)} elements"
        )
        result = bertscore_mean(self.predictions, self.references)
        return result

    # Removes unneccessary line breaks from input
    def list_cleaner(self):
        for i in range(len(self.predictions)):
            self.predictions[i] = self.predictions[i].replace(
                "\n", "").replace("\r", "")
        for i in range(len(self.references)):
            self.references[i] = self.references[i].replace(
                "\n", "").replace("\r", "")

    # Evaluation wrapper collecting and steering scores computation.
    def evaluate(self, metrics, predictions, references, socket_connection=False):
        self.predictions = predictions
        self.references = references
        response = {}

        if "BLEU" in metrics:
            if socket_connection:
                emit("loading", "BLEU computation ...")
            score = self.evaluate_bleu()
            response.update(score)
            if socket_connection:
                emit("evaluation-score", score)
        if "ROUGE" in metrics:
            if socket_connection:
                emit("loading", "ROUGE computation ...")
            score = self.evaluate_rouge()
            response.update(score)
            if socket_connection:
                emit("evaluation-score", score)
        if "METEOR" in metrics:
            if socket_connection:
                emit("loading", "METEOR computation ...")
            score = self.evaluate_meteor()
            response.update(score)
            if socket_connection:
                emit("evaluation-score", score)
        if "BERTScore" in metrics:
            if socket_connection:
                emit("loading", "BERTSCORE computation ...")
            score = self.evaluate_bertscore()
            response.update(score)
            if socket_connection:
                emit("evaluation-score", score)
        if socket_connection:
            emit("loading", "Finished evaluation.")
        return response
