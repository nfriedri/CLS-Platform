# from datasets import load_metric
from environment import CACHE_DIR
from datasets import load_metric

meteor = load_metric("meteor", cache_dir=CACHE_DIR)


# Compute mean rouge scores for single reference per prediction
def meteor_mean(predictions, references):
    scores_mean = []
    for i in range(len(predictions)):
        value = float(meteor._compute(predictions[i], references[i])["meteor"])
        scores_mean.append(value)
    mean_score = sum(scores_mean)/len(scores_mean)
    return {"meteor": mean_score}


# Computes Mean & Max ROUGE scores for predictions against lists of references
def meteor_mean_max(predictions, references):
    scores_mean = []
    scores_max = []
    for i in range(len(references)):
        max_score = {}
        max_val = 0.0
        for j in range(len(references[i])):
            value = float(meteor._compute(
                predictions[i], references[i][j])["meteor"])
            scores_mean.append(value)
            if value > max_val:
                max_val = value
                max_score = value
        scores_max.append(max_score)
    mean_score = sum(scores_mean)/len(scores_mean)
    max_score = sum(scores_max)/len(scores_max)
    return {"meteor": {"mean": mean_score, "max": max_score}}
