import os
import logging
from dotenv import load_dotenv
import distutils
import torch

load_dotenv()

DESKTOP = os.environ.get("DESKTOP")

HOST = os.environ.get("HOST")
PORT = int(os.environ.get("PORT"))
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DEVICE = "cpu"

UPLOAD_DIR = os.environ.get("UPLOAD_DIR")
CACHE_DIR = os.environ.get("CACHE_DIR")
MODELS_DIR = os.environ.get("MODELS_DIR")
CHECKPOINT_DIR = os.environ.get("CHECKPOINT_DIR")
EXAMPLES_DIR = os.environ.get("EXAMPLES_DIR")

MODELS_FILE = os.path.join(CHECKPOINT_DIR, os.environ.get("MODELS_FILE"))
CHECKPOINTS_FILE = os.path.join(
    CHECKPOINT_DIR, os.environ.get("CHECKPOINTS_FILE"))
EVALUATION_FILE = os.path.join(
    CHECKPOINT_DIR, os.environ.get("EVALUATION_FILE"))
CL_LANGUAGES_FILE = os.path.join(
    CHECKPOINT_DIR, os.environ.get("CL_LANGUAGES_FILE"))

TRANSFORMER_MAX_TOKENS = int(os.environ.get("TRANSFORMER_MAX_TOKENS"))
PEGASUS_MAX_TOKENS = int(os.environ.get("PEGASUS_MAX_TOKENS"))
OPUS_MAX_TOKENS = int(os.environ.get("OPUS_MAX_TOKENS"))
LONGFORMER_MAX_TOKENS = int(os.environ.get("LONGFORMER_MAX_TOKENS"))

ALLOWED_EXTENSIONS = {"txt", "hypo", "json", "jsonl", "source", "target"}

languages_long_raw = open(os.path.join(
    CHECKPOINT_DIR, os.environ.get("LANGUAGES_LONG_FILE")), "r").readlines()
LANGUAGES_LONG = [lang.replace("\n", "") for lang in languages_long_raw]
languages_short_raw = open(os.path.join(
    CHECKPOINT_DIR, os.environ.get("LANGUAGES_SHORT_FILE")), "r").readlines()
LANGUAGES_SHORT = [lang.replace("\n", "") for lang in languages_short_raw]
LANGUAGES_OPUS = [lang[0:2] for lang in LANGUAGES_SHORT]
languages_pres_raw = open(os.path.join(
    CHECKPOINT_DIR, os.environ.get("LANGUAGES_PRES_FILE")), "r").readlines()
LANGUAGES_PRESENTED = [lang.replace("\n", "") for lang in languages_pres_raw]

logging.info(f"-----LOADED CONFIGURATION------")
logging.info(f"Upload directory: {UPLOAD_DIR}")
logging.info(f"Cache directory:  {CACHE_DIR}")
os.environ["TRANSFORMERS_CACHE"] = CACHE_DIR
