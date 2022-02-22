from turtle import down
from datasets import hf_bucket_url
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from environment import CACHE_DIR
import os
from tqdm import tqdm
from argparse import ArgumentParser
import requests
from scripts.convert_bart import convert_bart_checkpoint


hf_checkpoints = [
    "google/pegasus-large",
    "google/pegasus-xsum",
    "facebook/bart-large-cnn",
    "facebook/bart-large-xsum",
    "facebook/mbart-large-cc25",
    "allenai/led-large-16384-arxiv",
    "facebook/mbart-large-50-many-to-many-mmt"
]

default_output_path = "./models"


def download_bertscore():
    from bert_score import score
    predictions = ["The CLS platform is a great app."]
    references = ["The CLS platform is a great app."]
    P, R, F1 = score(predictions, references, lang="en", verbose=True)
    print("Downloaded and executed BERTScore successfully.")


def download_tldr(output_dir):
    print("Starting downloading SciTLDR BART XSUM model.")
    url = "https://storage.cloud.google.com/skiff-models/scitldr/bart-xsum.tldr-ao.pt"
    data = requests.get(url, allow_redirects=True)
    open("scitldr-bart-xsum.pt", "wb").write(data.content)
    print("Converting BART model.")
    convert_bart_checkpoint("scitldr-bart-xsum.pt",
                            f"{output_dir}/scitldr-bart-xsum", hf_checkpoint_name="facebook/bart-large-xsum")
    os.remove("scitldr-bart-xsum.pt")
    print("Converted SciTLDR BART XSUM model successfully.")


def download_list(output_dir, scitldr, bert_score):
    if output_dir == None:
        output_dir = default_output_path
    for i in tqdm(range(len(hf_checkpoints)), total=len(hf_checkpoints)):
        name = hf_checkpoints[i].split("/")[1]
        model = AutoModelForSeq2SeqLM.from_pretrained(
            hf_checkpoints[i], cache_dir=CACHE_DIR)
        tokenizer = AutoTokenizer.from_pretrained(
            hf_checkpoints[i], cache_dir=CACHE_DIR)
        model.save_pretrained(f"{output_dir}/{name}")
        tokenizer.save_pretrained(f"{output_dir}/{name}")
        files = os.listdir(CACHE_DIR)
        for f in files:
            os.remove(os.path.join(CACHE_DIR, f))
        print(f"Downloaded model {i} of {len(hf_checkpoints)}.")
    if scitldr:
        download_tldr(output_dir)
    if bert_score:
        download_bertscore()


def download_model(model_id, output_dir):
    name = model_id.split("/")[1]
    model = AutoModelForSeq2SeqLM.from_pretrained(
        model_id, cache_dir=CACHE_DIR)
    tokenizer = AutoTokenizer.from_pretrained(model_id, cache_dir=CACHE_DIR)
    model.save_pretrained(f"{output_dir}/{name}")
    tokenizer.save_pretrained(f"{output_dir}/{name}")
    files = os.listdir(CACHE_DIR)
    for f in files:
        os.remove(os.path.join(CACHE_DIR, f))
    print(f"Downloaded model {model_id}.")


def run(download_all, model_id, output_dir, scitldr, bert_score):
    if download_all:
        return download_list(output_dir, scitldr, bert_score)
    elif scitldr:
        return download_tldr(output_dir)
    elif bert_score:
        return download_bertscore()
    else:
        return download_model(model_id, output_dir)


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--download-all", action="store_true",
                        help="Download all required models.")
    parser.add_argument("--model_id", type=str, required=False,
                        help="Model ID of one specific model.")
    parser.add_argument("--output-dir", type=str, required=False,
                        help="Directory to store the model(s) in. Defaults to the models dir.")
    parser.add_argument("--scitldr", action="store_true",
                        help="Download and convert the SciTLDR BART XSUM model.")
    parser.add_argument("--bert-score", action="store_true",
                        help="Download the BERTScore model data.")

    args = parser.parse_args()
    run(args.download_all, args.model_id,
        args.output_dir, args.scitldr, args.bert_score)
