# imports
import json
from transformers import MBartForConditionalGeneration, MBartTokenizer
import pytorch_lightning as pl
import torch
from argparse import ArgumentParser


class MBartLightningModel(pl.LightningModule):
    # Instantiate the model
    def __init__(self, tokenizer, model):
        super().__init__()
        self.tokenizer = tokenizer
        self.model = model

    # Do a forward pass through the model
    def forward(self, input_ids, **kwargs):
        return self.model(input_ids, **kwargs)

    def generate_(self, text, eval_beams, early_stopping=True, max_len=64):
        ''' Function to generate text '''
        generated_ids = self.model.generate(
            text["input_ids"],
            attention_mask=text["attention_mask"],
            use_cache=True,
            decoder_start_token_id=self.tokenizer.lang_code_to_id["ru_RU"],
            num_beams=eval_beams,
            max_length=max_len,
            early_stopping=early_stopping,

        )
        return generated_ids

# -----------------------------------------------------------------------------------


def generate_(text, model_, tokenizer_):
    # Put the model on eval mode

    tokens = tokenizer_(text, padding='max_length',
                        return_tensors="pt", truncation=True, src_lang="de_DE").to("cuda")
    summary_ids = model_.generate_(
        tokens, eval_beams=4)
    with tokenizer_.as_target_tokenizer():
        output = ([tokenizer_.decode(g, skip_special_tokens=True,
                                     clean_up_tokenization_spaces=True, tgt_lang="de_DE") for g in summary_ids])
    return output[0]


def summarize(text, model, tokenizer):
    output = generate_(text, model_=model, tokenizer_=tokenizer)
    return output


def array_to_string(array):
    text = ""
    for ele in array:
        text += ele + " "
    text = text.replace("\n", "").replace("\r", "")
    return text


def run(checkpoint_path, test_file, output_file, src_lang, tgt_lang):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device is set to {device}")

    tokenizer = MBartTokenizer.from_pretrained(
        "facebook/mbart-large-cc25", src_lang=src_lang, tgt_lang=tgt_lang)

    bart_model = MBartForConditionalGeneration.from_pretrained(
        "facebook/mbart-large-cc25")

    model = MBartLightningModel.load_from_checkpoint(
        checkpoint_path=checkpoint_path, strict=False, tokenizer=tokenizer, model=bart_model)

    model.to(torch.device('cuda'))
    model.eval()

    print("Starting GENERATION")

    # ---------Variable to be set:
    file_path = test_file
    output_file_path = output_file
    # --------------------------
    file = open(file_path, "r", encoding="utf-8")
    output = open(output_file_path, "a", encoding="utf-8")
    lines = file.readlines()
    for i in range(len(lines)):
        data = json.loads(lines[i])
        result = summarize(array_to_string(
            data["source"]), model=model, tokenizer=tokenizer)
        print(str(result))
        output.write(str(result) + " \n")
        print(f"Processed TLDR #{i} from total {len(lines)} TLDRs")
    output.close()
    file.close()


if __name__ == "__main__":
    parser = ArgumentParser()
    # Required parameters
    parser.add_argument("--checkpoint_path", type=str,
                        help="Path of the checkpoint file to be used.")
    parser.add_argument("--test_file", type=str,
                        help="Path to the test file containing the documents.")
    parser.add_argument("--output_file", type=str,
                        help="File to save generated summaries in.")
    parser.add_argument("--src-lang", type=str, default="en_XX", required=False,
                        help="Language of the source documents as mBART accepted language id.")
    parser.add_argument("--tgt-lang", type=str, default="de_DE", required=False,
                        help="Language of the target generations as mBART accepted language id.")

    args = parser.parse_args()
    run(args.checkpoint_path, args.test_file,
        args.output_file, args.src_lang, args.tgt_lang)
