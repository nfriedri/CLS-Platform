# imports
import os
from transformers import MBartForConditionalGeneration, MBartTokenizer
import torch
import pytorch_lightning as pl
from argparse import ArgumentParser


class MBartLightningModel(pl.LightningModule):
    def __init__(self, model, tokenizer):
        super().__init__()
        self.model = model
        self.tokenizer = tokenizer

    def forward(self, input_ids, **kwargs):
        return self.model(input_ids, **kwargs)

    def generate(self, text, tokenizer, eval_beams, tgt_lang, early_stopping=True, max_len=64):
        ''' Function to generate text '''
        generated_ids = self.model.generate(
            text["input_ids"],
            attention_mask=text["attention_mask"],
            use_cache=True,
            # decoder_start_token_id=tokenizer.pad_token_id,
            decoder_start_token_id=tokenizer.lang_code_to_id[tgt_lang],
            num_beams=eval_beams,
            max_length=max_len,
            early_stopping=early_stopping,
        )
        return generated_ids

    def save_model(self, save_path):
        self.tokenizer.save_pretrained(save_path)
        self.model.save_pretrained(save_path)

# -----------------------------------------------------------------------------------


def run(checkpoint_path, output_path, src_lang, tgt_lang):
    tokenizer = MBartTokenizer.from_pretrained(
        "facebook/mbart-large-cc25", src_lang=src_lang, tgt_lang=tgt_lang)

    bart_model = MBartForConditionalGeneration.from_pretrained(
        "facebook/mbart-large-cc25")

    model = MBartLightningModel.load_from_checkpoint(
        checkpoint_path=checkpoint_path, strict=False, tokenizer=tokenizer, model=bart_model)
    model.eval()
    model.save_model(output_path)


if __name__ == "__main__":
    parser = ArgumentParser()
    # Required parameters
    parser.add_argument("--checkpoint_path", type=str,
                        help="Path of the checkpoint file to be used.")
    parser.add_argument("--output_path", type=str,
                        help="Path to save model.")
    parser.add_argument("--src-lang", type=str, default="en_XX", required=False,
                        help="Language of the source documents as mBART accepted language id.")
    parser.add_argument("--tgt-lang", type=str, default="de_DE", required=False,
                        help="Language of the target generations as mBART accepted language id.")

    args = parser.parse_args()
    run(args.checkpoint_path, args.output_path, args.src_lang, args.tgt_lang)
