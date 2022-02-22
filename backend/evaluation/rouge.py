# from datasets import load_metric
import logging
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(
    ['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
# rouge = load_metric("rouge")


# Compute mean rouge scores for single reference per prediction
# --> DEPRECATED, not used anymore
def rouge_mean(predictions, references):
    scores_mean = []
    for i in range(len(predictions)):
        value = scorer.score(predictions[i], references[i])
        scores_mean.append(value)
    mean_dict = list_to_output(scores_mean)
    return {"rouge": mean_dict}


# Computes Mean & Max ROUGE scores for predictions against lists of references
# ROUGE-1 oriented implementation --> DEPRECATED, not used anymore
def rouge_mean_max(predictions, references):
    scores_mean = []
    scores_max = []
    for i in range(len(references)):
        max_score = {}
        max_val = 0
        for j in range(len(references[i])):
            value = scorer.score(predictions[i], references[i][j])
            scores_mean.append(value)
            if value["rouge1"][2] > max_val:
                max_val = value["rouge1"][2]
                max_score = value
        scores_max.append(max_score)
    mean_dict = list_to_output(scores_mean)
    max_dict = list_to_output(scores_max)
    return {"rouge": {"mean": mean_dict, "max": max_dict}}


# Compute mean rouge scores for single reference per prediction
def rouge_mean(predictions, references):
    logging.info("ROUGE mean scoring.")
    rouge_1_scores_mean = []
    rouge_2_scores_mean = []
    rouge_L_scores_mean = []
    for i in range(len(references)):
        r1 = []
        r2 = []
        rl = []
        for j in range(len(references[i])):
            value = scorer.score(predictions[i], references[i][j])
            r1.append(value["rouge1"][2])
            r2.append(value["rouge2"][2])
            rl.append(value["rougeL"][2])
        rouge_1_scores_mean.append(sum(r1)/len(r1))
        rouge_2_scores_mean.append(sum(r2)/len(r2))
        rouge_L_scores_mean.append(sum(rl)/len(rl))
    mean_dict = {"rouge_1": sum(rouge_1_scores_mean)/len(rouge_1_scores_mean), "rouge_2": sum(
        rouge_2_scores_mean)/len(rouge_2_scores_mean), "rouge_L": sum(rouge_L_scores_mean)/len(rouge_L_scores_mean)}
    return {"rouge": mean_dict}


# Computes Mean & Max ROUGE scores for predictions against lists of references
def rouge_mean_max(predictions, references):
    logging.info("ROUGE mean-max scoring.")
    rouge_1_scores_max = []
    rouge_2_scores_max = []
    rouge_L_scores_max = []
    rouge_1_scores_mean = []
    rouge_2_scores_mean = []
    rouge_L_scores_mean = []
    for i in range(len(references)):
        r1 = []
        r2 = []
        rl = []
        for j in range(len(references[i])):
            value = scorer.score(predictions[i], references[i][j])
            r1.append(value["rouge1"][2])
            r2.append(value["rouge2"][2])
            rl.append(value["rougeL"][2])
        rouge_1_scores_max.append(max(r1))
        rouge_2_scores_max.append(max(r2))
        rouge_L_scores_max.append(max(rl))
        rouge_1_scores_mean.append(sum(r1)/len(r1))
        rouge_2_scores_mean.append(sum(r2)/len(r2))
        rouge_L_scores_mean.append(sum(rl)/len(rl))
    mean_dict = {"rouge_1": sum(rouge_1_scores_mean)/len(rouge_1_scores_mean), "rouge_2": sum(
        rouge_2_scores_mean)/len(rouge_2_scores_mean), "rouge_L": sum(rouge_L_scores_mean)/len(rouge_L_scores_mean)}
    max_dict = {"rouge_1": sum(rouge_1_scores_max)/len(rouge_1_scores_max), "rouge_2": sum(
        rouge_2_scores_max)/len(rouge_2_scores_max), "rouge_L": sum(rouge_L_scores_max)/len(rouge_L_scores_max)}
    return {"rouge": {"mean": mean_dict, "max": max_dict}}


# Transforms list of scores into dict object --> DEPRECATED
def list_to_output(scores):
    rouge_1_precision = []
    rouge_1_recall = []
    rouge_1_fscore = []
    rouge_2_precision = []
    rouge_2_recall = []
    rouge_2_fscore = []
    rouge_L_precision = []
    rouge_L_recall = []
    rouge_L_fscore = []
    for score in scores:
        try:
            rouge_1_precision.append(score["rouge1"][0])
            rouge_1_recall.append(score["rouge1"][1])
            rouge_1_fscore.append(score["rouge1"][2])
            rouge_2_precision.append(score["rouge2"][0])
            rouge_2_recall.append(score["rouge2"][1])
            rouge_2_fscore.append(score["rouge2"][2])
            rouge_L_precision.append(score["rouge2"][0])
            rouge_L_recall.append(score["rougeL"][1])
            rouge_L_fscore.append(score["rougeL"][2])
        except KeyError:
            logging.error("KeyError occured -- missing one score")
            pass
    rouge_1 = {"precision": sum(rouge_1_precision)/len(rouge_1_precision),
               "recall": sum(rouge_1_recall)/len(rouge_1_recall),
               "f1_score": sum(rouge_1_fscore)/len(rouge_1_fscore)}
    rouge_2 = {"precision": sum(rouge_2_precision)/len(rouge_2_precision),
               "recall": sum(rouge_2_recall)/len(rouge_2_recall),
               "f1_score": sum(rouge_2_fscore)/len(rouge_2_fscore)}
    rouge_L = {"precision": sum(rouge_L_precision)/len(rouge_L_precision),
               "recall": sum(rouge_L_recall)/len(rouge_L_recall),
               "f1_score": sum(rouge_L_fscore)/len(rouge_L_fscore)}
    output = {"rouge_1": rouge_1, "rouge_2": rouge_2, "rouge_L": rouge_L}
    return output
