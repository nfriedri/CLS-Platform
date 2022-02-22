import os
import logging
import re

from flask_socketio import emit
from transformers import (
    MBart50TokenizerFast,
    MBartForConditionalGeneration,
    MarianMTModel,
    MarianTokenizer
)
from environment import (
    CACHE_DIR, DEVICE, MODELS_DIR, TRANSFORMER_MAX_TOKENS, OPUS_MAX_TOKENS, LANGUAGES_LONG, LANGUAGES_SHORT, LANGUAGES_OPUS, LANGUAGES_PRESENTED
)
import summarization.blueprint as summarization

device = DEVICE
logging.info(f"TRANSLATOR: CUDA Device is set to {device}")

# Tries to retrieve correct language identifier for opus models


def set_lang_opus(lang):
    logging.info(f"Searching for correct opus language identifier for {lang}")
    for language in LANGUAGES_SHORT:
        if lang in language:
            return language[0:2]
    for language in LANGUAGES_LONG:
        if lang in language:
            return language[-6:-4]
    else:
        raise ValueError("The requested language is not available")

# Tries to retrieve correct language identifiers for mBART models


def set_lang_mbart(lang):
    logging.info(f"Searching for correct mBART language identifier for {lang}")
    for ele in LANGUAGES_SHORT:
        if lang in ele:
            return ele
    for ele in LANGUAGES_LONG:
        if lang in ele:
            return ele[-6:-1]
    raise ValueError("The requested language is not available")


# Translator class
class Translator:
    def __init__(self, opus=False, source_lang=None, target_lang=None):
        logging.info("Initializing")
        self.model = None
        self.tokenizer = None
        self.opus = opus
        self.model_name = ""
        self.source_language = source_lang
        self.target_language = target_lang

    # Initialize the translation model and tokenizer
    def start_translator(self, socket_connection=False):
        summarization.summarizer.reset_summarizer()
        if self.opus:
            logging.info(
                f"Starting initializing OPUS translation model.")
        else:
            logging.info(
                "Starting initializing mBART50 mmt model.")
        self.set_languages()
        if self.opus:
            model_name = f"Helsinki-NLP/opus-mt-{self.source_language}-{self.target_language}"
            self.model = MarianMTModel.from_pretrained(
                model_name, cache_dir=CACHE_DIR)
            self.tokenizer = MarianTokenizer.from_pretrained(
                model_name, cache_dir=CACHE_DIR)
            self.model_name = "opus"
            if socket_connection:
                emit("loading", f"Successfully loaded model {model_name}")
        else:
            model_path = os.path.join(
                MODELS_DIR, "mbart-large-50-many-to-many-mmt")
            self.model = MBartForConditionalGeneration.from_pretrained(
                model_path).to(device)
            self.tokenizer = MBart50TokenizerFast.from_pretrained(
                model_path, src_lang=self.source_language, tgt_lang=self.target_language)
            self.model_name = "mbart"
            if socket_connection:
                emit(
                    "loading", f"Successfully loaded model mbart-large-50-many-to-many-mmt")
        logging.info("Initialized model.")

    # Reset the translator settings and model
    def reset_translator(self):
        self.model = None
        self.tokenizer = None
        self.model_name = ""
        logging.info("Translator is reseted")

    # Call language settings for source and target languages.
    def set_languages(self):
        if self.opus:
            if len(self.source_language) == 2 and len(self.target_language) == 2:
                pass
            else:
                self.source_language = set_lang_opus(self.source_language)
                self.target_language = set_lang_opus(self.target_language)
        else:
            if len(self.source_language) == 4 and len(self.target_language) == 4:
                pass
            else:
                self.source_language = set_lang_mbart(self.source_language)
                self.target_language = set_lang_mbart(self.target_language)

    # Translation Wrapper to translate an input text into the target language
    def translate(self, opus, text, source_language, target_language, socket_connection=False):
        logging.info(
            f"Started translation process. Src-lang: {self.source_language} ---> Tgt-lang: {self.target_language}")
        if opus:
            self.opus = True
        self.source_language = source_language
        self.target_language = target_language
        self.start_translator(socket_connection=socket_connection)
        if self.opus:
            return self.translate_opus(text, socket_connection=socket_connection)
        else:
            return self.translate_mbart(text, self.source_language, self.target_language, socket_connection=socket_connection)

    # Translation using OPUS model
    def translate_opus(self, text, socket_connection=False):
        batch = self.tokenizer(text, return_tensors="pt",
                               padding=True).to(device)
        if socket_connection:
            emit(
                "loading", f"Tokenized input data.  Received {batch.input_ids.size()[1]} tokens.")
        logging.info(f"Encoded token length: {batch.input_ids.size()[1]}")
        translated = self.model.generate(**batch)
        output = [self.tokenizer.decode(
            t, skip_special_tokens=True) for t in translated][0]
        if socket_connection:
            emit("loading", f"Finished translation process.")
        logging.info("Translated text successfully.")
        logging.info(f"Translation: {output}")
        return output

    # Translation using mBART model
    def translate_mbart(self, text, src_lang, tgt_lang, socket_connection=False):
        self.tokenizer.src_lang = src_lang
        encoded = self.tokenizer(text, return_tensors="pt").to(device)
        if socket_connection:
            emit(
                "loading", f"Tokenized input data.  Received {encoded.input_ids.size()[1]} tokens.")
        logging.info(f"Encoded token length: {encoded.input_ids.size()[1]}.")
        generated_tokens = self.model.generate(
            **encoded, forced_bos_token_id=self.tokenizer.lang_code_to_id[tgt_lang])
        output = self.tokenizer.batch_decode(
            generated_tokens, skip_special_tokens=True)[0]
        if socket_connection:
            emit("loading", f"Finished translation process.")
        logging.info("Translated text successfully.")
        logging.info(f"Translation: {output}")
        return output

    # Sentence-per-sentence translation for long input texts.
    def batch_translation(self, text, opus, source_language, target_language, socket_connection=False):
        if opus:
            self.opus = True
        self.source_language = source_language
        self.target_language = target_language
        self.start_translator(socket_connection=socket_connection)
        text_slices = self.text_to_slices(text)
        logging.info(
            f"Batch translation started translating {len(text_slices)} batches.")
        if socket_connection:
            emit(
                "loading", f"Separated text into {len(text_slices)} slices. Starting tranlsation process.")
            emit("slices", len(text_slices))
        output = ""
        if self.opus:
            for i in range(len(text_slices)):
                output += self.translate_opus(
                    text_slices[i], socket_connection=False) + " "
                logging.info(
                    f"Translated slice {i+1} of total {len(text_slices)} slices.")
                if socket_connection:
                    emit(
                        "loading", f"Translated slice {i+1} of total {len(text_slices)} slices.")
        else:
            for i in range(len(text_slices)):
                output += self.translate_mbart(
                    text_slices[i], self.source_language, self.target_language, socket_connection=False) + " "
                logging.info(
                    f"Translated slice {i+1} of total {len(text_slices)} slices.")
                if socket_connection:
                    emit(
                        "loading", f"Translated slice {i+1} of total {len(text_slices)} slices.")
        if socket_connection:
            emit("loading", f"Finished translation process.")
        logging.info("Batch translation successfully.")
        logging.info(f"Translation: {output}")
        return output

    # Retrieve tokenized length of a text
    def get_tokenized_length(self, text):
        encoded = self.tokenizer(text, return_tensors="pt", truncation=False)
        return encoded.input_ids.size()[1]

    # Split text input into an array of sentences.
    def text_to_slices(self, text, socket_connection=False):
        border = OPUS_MAX_TOKENS if self.opus else TRANSFORMER_MAX_TOKENS
        text = text.replace("\n ", "")
        text_array = re.findall(".*?[.!\?]", text)
        max_numbers = []
        memory = ""
        for i in range(len(text_array)):
            memory += text_array[i]
            token_length = self.get_tokenized_length(memory)
            if token_length < border:
                try:
                    max_numbers.append(i)
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
            text_slice += text_array[k] + " "
            if k in max_numbers:
                slices.append(text_slice)
                text_slice = ""
        return slices
