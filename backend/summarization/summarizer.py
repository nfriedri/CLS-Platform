import os
import logging
import torch
import re
import json

from tika import language
from flask_socketio import emit
# from reset import reset_translator
# from translation.translator import set_lang_mbart
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
)
import translation.blueprint as translation

from environment import (
    DEVICE,
    MODELS_DIR,
    CHECKPOINTS_FILE,
    CL_LANGUAGES_FILE,
    TRANSFORMER_MAX_TOKENS,
    PEGASUS_MAX_TOKENS,
    LONGFORMER_MAX_TOKENS,
    LANGUAGES_SHORT,
    LANGUAGES_LONG,
)
import numpy as np

device = DEVICE
logging.info(f"CUDA Device is set to {device}")


def set_lang_mbart(lang):
    logging.info(f"Searching for correct mBART language identifier for {lang}")
    for ele in LANGUAGES_SHORT:
        if lang in ele:
            return ele
    for ele in LANGUAGES_LONG:
        if lang in ele:
            return ele[-6:-1]
    raise ValueError("The requested language is not available")


# Summarization module class
class Summarizer:
    def __init__(self):
        logging.info("Initializing summarization module")
        self.checkpoint = ""
        self.model_path = ""
        self.model = None
        self.tokenizer = None
        self.text = ""
        self.summary = ""

    # Get data about included summarization models
    def get_checkpoints(self):
        checkpoint_file = open(CHECKPOINTS_FILE, "r", encoding="utf-8")
        checkpoints = json.load(checkpoint_file)
        return checkpoints

    # Get data about included cross-lingual models
    def get_cl_languages(self):
        cl_lang_file = open(CL_LANGUAGES_FILE, "r")
        langs = json.load(cl_lang_file)
        return langs

    # Reset the model and tokenizer
    def reset_summarizer(self):
        self.model = None
        self.tokenizer = None
        self.model_path = ""
        self.checkpoint = ""
        logging.info("Summarizer is reseted")

    # Load a model and a tokenizer into memory

    def preload_model(self, model_name, socket_connection=False, huggingface=False):
        logging.info(f"Initializing model {model_name}")
        translation.translator.reset_translator()
        if model_name == self.checkpoint:
            pass
        else:
            if huggingface:
                self.model_path = model_name
            else:
                self.model_path = os.path.join(MODELS_DIR, model_name)
            if "led" in model_name:
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    self.model_path, return_dict_in_generate=True
                ).to(DEVICE)
            else:
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    self.model_path).to(DEVICE)
                # TODO: Clarify to use this or AutoModelForConditionalGeneration?
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path, use_fast=False)
            self.checkpoint = model_name
        if socket_connection:
            emit(f"Loaded model {model_name} successfully")
        logging.info(f"{model_name} initialized.")
        return f"Loaded model {model_name} successfully"

    # Summarization Wrapper forwarding to generation definitions depending on selected model
    def summarize(self, model_name, text, truncation=False, socket_connection=False, src_lang=None, tgt_lang=None, huggingface=False):
        summary = ""
        if model_name != self.checkpoint:
            logging.info(f"Model has changed. Loading new model: {model_name}")
            self.preload_model(model_name, huggingface=huggingface)
        if socket_connection:
            emit("loading", f"Successfully loaded model {model_name}.")
        try:
            if "led" in model_name:
                summary = self.led_summarize(
                    text, truncation, socket_connection)
            elif "mbart-tldr" in model_name:
                summary = self.mbart_tldr_summarizer(
                    text, src_lang=src_lang, tgt_lang=tgt_lang, socket_connection=socket_connection)
            elif "mbart" in model_name:
                summary = self.mbart_summarizer(
                    text, truncation, src_lang=src_lang, tgt_lang=tgt_lang, socket_connection=socket_connection)
            # elif "pegasus" in model_name:
            #     summary = self.pegasus_summarizer(text, truncation, socket_connection)
            else:
                summary = self.simple_summarizer(
                    text, truncation, socket_connection)
        except IndexError:
            if socket_connection:
                emit('error', f"Failed - Input text is too long for the chosen model. Enable truncation of the text or try cascading summarization.")
        return summary

    # Summarization using LED models
    def led_summarize(self, text, truncation, socket_connection):
        inputs = self.tokenizer(
            text, truncation=truncation, return_tensors="pt").input_ids.to(DEVICE)
        if socket_connection:
            emit(
                "loading", f"Tokenization succesful. Received {inputs.size()[1]} tokens.")
        global_attention_mask = torch.zeros_like(inputs).to(DEVICE)
        global_attention_mask[:, 0] = 1
        summary_ids = self.model.generate(
            inputs, global_attention_mask=global_attention_mask, num_beams=3, max_length=64, early_stopping=True)
        output = self.tokenizer.batch_decode(
            summary_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        if socket_connection:
            emit('loading', "Finished text summarization task.")
        logging.info(f"Summary: {output[0]}")
        return output[0]

    # Summarization using mBART models
    def mbart_summarizer(self, text, truncation, src_lang=None, tgt_lang=None, socket_connection=False):
        lang = language.from_buffer(text)
        if src_lang == None and tgt_lang == None:
            source_lang = set_lang_mbart(lang)
            target_lang = set_lang_mbart(lang)
        else:
            source_lang = set_lang_mbart(src_lang)
            target_lang = set_lang_mbart(tgt_lang)
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_path, src_lang=source_lang, tgt_lang=target_lang, use_fast=False)
        batch = self.tokenizer(text, truncation=truncation,
                               padding="max_length", return_tensors="pt").to(DEVICE)
        if socket_connection:
            emit(
                "loading", f"Tokenization succesful. Received {batch.input_ids.size()[1]} tokens.")
        translated = self.model.generate(batch.input_ids, num_beams=4, max_length=64, early_stopping=True,
                                         decoder_start_token_id=self.tokenizer.lang_code_to_id[target_lang])
        with self.tokenizer.as_target_tokenizer():
            output = [self.tokenizer.decode(
                g, skip_special_tokens=True, clean_up_tokenization_spaces=False) for g in translated]
        if socket_connection:
            emit('loading', "Finished text summarization task.")
        logging.info(f"Summary: {output[0]}")
        return output[0]

    # Cross-lingual summarization using mBART TLDR Generation models
    def mbart_tldr_summarizer(self, text, src_lang="en_XX", tgt_lang="de_DE", socket_connection=False):
        # Usually would need language initialization as mBART generation function above but due to fine-tuning it is possible without.
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_path, src_lang=src_lang, tgt_lang=tgt_lang, use_fast=False)
        batch = self.tokenizer(text, padding='max_length',
                               return_tensors="pt", truncation=True).to(DEVICE)
        if socket_connection:
            emit(
                "loading", f"Tokenization succesful. Received {batch.input_ids.size()[1]} tokens.")
        summary_ids = self.model.generate(
            batch.input_ids, num_beams=4, max_length=64, early_stopping=True,
            decoder_start_token_id=self.tokenizer.lang_code_to_id[tgt_lang])
        with self.tokenizer.as_target_tokenizer():
            output = ([self.tokenizer.decode(g, skip_special_tokens=True,
                      clean_up_tokenization_spaces=True) for g in summary_ids])
        if socket_connection:
            emit('loading', "Finished text summarization task.")
        logging.info(f"Summary: {output[0]}")
        return output[0]

    # Summarization using pegasus summarizer --> Unnecessary works with simple summarizer def.
    def pegasus_summarizer(self, text, truncation, socket_connection):
        inputs = self.tokenizer(
            [text], truncation=truncation, return_tensors="pt").to(DEVICE)
        if socket_connection:
            emit(
                "loading", f"Tokenization succesful. Received {inputs.input_ids.size()[1]} tokens.")
        summary_ids = self.model.generate(inputs.input_ids)
        output = [self.tokenizer.decode(
            g, skip_special_tokens=True, clean_up_tokenization_spaces=False) for g in summary_ids]
        if socket_connection:
            emit('loading', "Finished text summarization task.")
        logging.info(f"Summary: {output[0]}")
        return output[0]

    # Collection for similar working summarization models --> BART & PEGASUS models
    def simple_summarizer(self, text, truncation, socket_connection):
        batch = self.tokenizer(text, truncation=truncation,
                               padding="max_length", return_tensors="pt")
        if socket_connection:
            emit(
                "loading", f"Tokenization succesful. Received {batch.input_ids.size()[1]} tokens.")
        translated = self.model.generate(**batch)
        output = self.tokenizer.batch_decode(
            translated, skip_special_tokens=True)
        if socket_connection:
            emit('loading', "Finished text summarization task.")
        logging.info(f"Summary: {output[0]}")
        return output[0]

    # Cascading summarization for too long input texts
    def cascading_summarization(self, model_name, text, socket_connection=False, huggingface=False):
        max_number = 0
        self.text = text
        if model_name != self.checkpoint:
            logging.info(f"Model has changed. Loading model {model_name}.")
            self.preload_model(model_name=model_name, huggingface=huggingface)
        if "led" in model_name:
            max_number = LONGFORMER_MAX_TOKENS
        elif "pegasus" in model_name:
            max_number = PEGASUS_MAX_TOKENS
        else:
            max_number = TRANSFORMER_MAX_TOKENS
        text_slices = self.text_to_slices(
            max_number, socket_connection=socket_connection)
        if socket_connection:
            emit(
                "loading", f"Split text into {len(text_slices)} slices with maximum tokens of {max_number}.")
            emit("slices", len(text_slices))
        logging.info(
            f"Split text into {len(text_slices)} slices with maximum tokens of {max_number}.")
        summaries = []
        for i in range(len(text_slices)):
            summaries.append(self.summarize(
                model_name, text_slices[i], truncation=False, huggingface=huggingface))
            if socket_connection:
                emit(
                    "loading", f"Summarized slice #{i+1} of total {len(text_slices)} slices.")
            logging.info(
                f"Summarized slice #{i+1} of total {len(text_slices)} slices.")
        if len(summaries) == 1:
            return summaries[0]
        summary = ""
        for summ in summaries:
            summary += summ
        if self.get_tokenized_length(summary) > max_number:
            if socket_connection:
                emit(
                    "loading", f"Generated summarization too long. Cascading another time.")
            logging.info(
                f"Generated summarization too long. Cascading another time.")
            return self.cascading_summarization(model_name, summary, socket_connection=socket_connection, huggingface=huggingface)
        result = self.summarize(model_name, summary, huggingface=huggingface)
        logging.info(f"Cascading summary: {result}")
        return result

    # Get number of tokens of input text
    def get_tokenized_length(self, text):
        encoded = self.tokenizer(text, return_tensors="pt", truncation=False)
        return encoded.input_ids.size()[1]

    # Split input text into slices that are slightly smaller than the max token number of the used model.
    def text_to_slices(self, border, socket_connection=False):
        self.text = self.text.replace("\n ", "")
        text_array = re.findall(".*?[.!\?]", self.text)
        max_numbers = []
        memory = ""
        for i in range(len(text_array)):
            memory += text_array[i]
            token_length = self.get_tokenized_length(memory)
            if token_length > border:
                try:
                    max_numbers.append(i-1)
                    memory = ""
                except:
                    if socket_connection:
                        emit("error",
                             "Failed - Input sentence is too long. Sentences longer than the max token length of the used model are not processable.")
                    return "Failed - Input sentence is too long. Sentences longer than the max token length of the used model are not processable."
            if i == (len(text_array) - 1):
                max_numbers.append(i)
        slices = []
        text_slice = ""
        for k in range(len(text_array)):
            text_slice += text_array[k]
            if k in max_numbers:
                slices.append(text_slice)
                text_slice = ""
        return slices
