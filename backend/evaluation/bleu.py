from sacrebleu import BLEU

bleu = BLEU()

def bleu_mean(predictions, references):
    assert len(predictions) != (references), f"Prediction: {len(predictions)} ---> References: {len(references)}"
    score = bleu.corpus_score(predictions, references).score
    return {"bleu": score}

