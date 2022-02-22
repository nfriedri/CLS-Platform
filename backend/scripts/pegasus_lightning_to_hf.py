# imports
import json
from transformers import PegasusForConditionalGeneration, PegasusTokenizer
from argparse import ArgumentParser
import pytorch_lightning as pl
import torch


class PegasusLightning(pl.LightningModule):
    # Instantiate the model
    def __init__(self, model):
        super().__init__()
        self.model = model

    # Do a forward pass through the model
    def forward(self, input_ids, **kwargs):
        return self.model(input_ids, **kwargs)

    def generate(self, text, eval_beams, early_stopping=True, max_len=64):
        ''' Function to generate text '''
        generated_ids = self.model.generate(
            text["input_ids"],
            attention_mask=text["attention_mask"],
            use_cache=True,
            num_beams=eval_beams,
            max_length=max_len,
            early_stopping=early_stopping,

        )
        return generated_ids

    def save_model(self, save_path):
        self.tokenizer.save_pretrained(save_path)
        self.model.save_pretrained(save_path)

# -----------------------------------------------------------------------------------


def run(checkpoint_path, output_path, model_id):
    tokenizer = PegasusTokenizer.from_pretrained(
        model_id)

    pegasus_model = PegasusForConditionalGeneration.from_pretrained(
        model_id)

    model = PegasusLightning.load_from_checkpoint(
        checkpoint_path=checkpoint_path, strict=False, tokenizer=tokenizer, model=pegasus_model)
    model.eval()
    model.save_model(output_path)
    print(f"Saved model succesfully to {output_path}")


if __name__ == "__main__":
    parser = ArgumentParser()
    # Required parameters
    parser.add_argument("--checkpoint_path", type=str,
                        help="Path of the checkpoint file to be used.")
    parser.add_argument("--output_path", type=str,
                        help="Path to save the model.")
    parser.add_argument("--model-id", type=str, required=False, default="google/pegasus-large",
                        help="Exact PEGASUS model checkpoint from huggingface to initialize the model.")

    args = parser.parse_args()
    run(args.checkpoint_path, args.output_path, args.model_id)
