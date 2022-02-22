# import os
# import logging
# import torch
# from langdetect import detect
# import re

# # from transformers import AutoTokenizer, AutoModelForSequenceClassification
# from transformers import pipeline
# from langdetect import detect

# import en_core_web_sm
# import de_core_news_sm
# import fr_core_news_sm
# import es_core_news_sm
# import it_core_news_sm


# DOMAIN_LABELS = ["article", "scientific"]

# CACHE_DIR = os.environ.get("CACHE_DIR")
# ANALYZER_MODEL = os.environ.get("ANALYZER_MODEL")
# TRANSFORMER_MAX_TOKENS = int(os.environ.get("TRANSFORMER_MAX_TOKENS"))

# # python -m spacy download en_core_web_sm
# # python -m spacy download de_core_news_sm
# # python -m spacy download fr_core_news_sm
# # python -m spacy download es_core_news_sm
# # python -m spacy download it_core_news_sm


# class Analyzer:
#     def __init__(self):
#         logging.info(f"ANALYZER: Initializing with {ANALYZER_MODEL}")
#         self.text = ""
#         self.token_number = 0
#         self.language = ""
#         self.labels = DOMAIN_LABELS
#         self.domain = ""
#         # self.classifier = None
#         self.classifier = pipeline(
#             task="zero-shot-classification", model=ANALYZER_MODEL, cache_dir=CACHE_DIR
#         )

#     def number_tokens(self):
#         nlp = None
#         if self.language == "en":
#             nlp = en_core_web_sm.load()
#         if self.language == "de":
#             nlp = de_core_news_sm.load()
#         if self.language == "fr":
#             nlp = fr_core_news_sm.load()
#         if self.language == "es":
#             nlp = es_core_news_sm.load()
#         if self.language == "it":
#             nlp = it_core_news_sm.load()
#         doc = nlp(self.text)
#         tokens = [token.text for token in doc]
#         self.token_number = len(tokens)
#         return self.token_number

#     def detect_language(self):
#         self.language = detect(self.text)
#         return self.language

#     def detect_domain(self):
#         classification = self.classifier(self.text, candidate_labels=self.labels)
#         self.domain = classification["labels"][0]
#         return classification["labels"], classification["scores"]

#     # Def to create model & checkpoint recommendation
#     def model_recommendation(self):
#         domain = self.domain
#         recommendation = ""
#         if self.language == "en":
#             if self.token_number > TRANSFORMER_MAX_TOKENS:
#                 if domain == "scientific":
#                     recommendation = "allenai/led-large-16384-arxiv"
#                 else:
#                     recommendation = "allenai/led-large-16384"
#             else:
#                 if domain == "scientific":
#                     recommendation = "google/pegasus-arxiv"
#                 if domain == "news" or domain == "article":
#                     recommendation = "google/pegasus-cnn_dailymail"
#         else:
#             recommendation = "mbart"
#         return recommendation

#     def analyze_text(self, text):
#         logging.info(f"ANALYZER: Analyzing given input text")
#         self.text = text
#         self.detect_language()
#         self.number_tokens()
#         self.detect_domain()
#         recommendation = self.model_recommendation()
#         return self.language, self.token_number, self.domain, recommendation
