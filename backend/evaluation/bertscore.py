from bert_score import score


def bertscore_mean(predictions, references, lang="en"):
    P, R, F1 = score(predictions, references, lang=lang, verbose=True)
    mean_p = P.mean().item()
    mean_r = R.mean().item()
    mean_f1 = F1.mean().item()
    scores = {"bert_score": {"precision": mean_p, "recall": mean_r, "f1_score": mean_f1}}
    return scores

