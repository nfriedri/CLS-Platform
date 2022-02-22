import traceback
import logging
import json
import os
from matplotlib.font_manager import json_dump

import requests
from tika import parser, language
from bs4 import BeautifulSoup

from flask import Blueprint, Response, request, send_from_directory, abort
from environment import (EXAMPLES_DIR, UPLOAD_DIR, ALLOWED_EXTENSIONS)

utils_bp = Blueprint('utils_bp', __name__)


@utils_bp.route("/detect-language", methods=["POST"])
def detect_language():
    text = ""
    if "text" in request.json:
        text = request.json["text"]
    else:
        abort(404)
    if text != "":
        detected = language.from_buffer(text)
        logging.info(f"Successfully detected following language: {detected}")
        return json.dumps({"language": detected})
    else:
        abort(400)


@utils_bp.route("/file-to-text", methods=["POST"])
def file_to_text():
    logging.info("Called file-to-text route")
    abstract_only = False
    if "abstract-only" in request.args:
        abstract_only = request.args.get("abstract-only")
    if "file" in request.files:
        file = request.files["file"]
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        file.save(file_path)
        if file.filename.split(".")[-1] == "txt":
            try:
                text = open(file_path, "r",
                            encoding="utf-8").read().replace("\n", "")
                logging.info(f"RETURNING: text --> {text}")
                os.remove(file_path)
                return json.dumps({"text": text})
            except TypeError:
                try:
                    text = open(file_path, "r",
                                encoding="utf-16").read().replace("\n", "")
                    logging.info(f"RETURNING: text --> {text}")
                    return json.dumps({"text": text})
                except TypeError:
                    os.remove(file_path)
                    return json.dumps({"error": "Encoding error. Please ensure that uploaded text files are encoded in utf-8 or utf-16."})
        if file.filename.split(".")[-1] == "pdf":
            parsed_pdf = parser.from_file(file_path)
            data = parsed_pdf['content']
            if abstract_only:
                content = data.split("Abstract")[1]
                content = content.split("Introduction")[0]
                content = content.replace("\n", " ").replace("-", "").strip()
            else:
                content = data.strip()
            logging.info(f"RETURNING: text --> {content}")
            os.remove(file_path)
            return json.dumps({"text": content})
        os.remove(file_path)
    else:
        logging.error(traceback.format_exc())
        return json.dumps({"error": "Provided file is not parsable."})


@utils_bp.route("/link-to-text", methods=["POST"])
def pdf_link_to_text():
    logging.info("Called link-to-text route")
    abstract_only = True
    if "abstract-only" in request.args:
        abstract_only = request.args.get("abstract-only")
    if "link" in request.json:
        url = request.json["link"]
        if "pdf" in url:
            try:
                return parse_pdf(url, abstract_only=abstract_only)
            except:
                return json.dumps({"error": "PDF parsing failed."})
        elif "arxiv" in url:
            try:
                return parse_arxiv(url)
            except:
                return json.dumps({"error": "Provided Arxiv link could not be parsed."})
        elif "aclanthology" in url:
            try:
                return parse_acl(url)
            except:
                return json.dumps({"error": "Provided ACL link could not be parsed."})
        else:
            return json.dumps({"error": "No supported link provided. Only hosted pdf-files, or ARXIV / ACL Anthology links are supported."})
    else:
        return json.dumps({"error": "No link provided. Please provide a link and try again."})


def parse_pdf(url, abstract_only=True):
    response = requests.get(url)
    filename = url.split("/")[-1]
    file_path = os.path.join(UPLOAD_DIR, filename)
    pdf = open(file_path, 'wb')
    pdf.write(response.content)
    pdf.close()
    try:
        parsed_pdf = parser.from_file(file_path)
        if abstract_only:
            data = parsed_pdf['content']
            abstract = data.split("Abstract")[1]
            abstract = abstract.split("Introduction")[0]
            abstract = abstract.replace("\n", " ").replace("-", "")
            logging.info(f"RETURNING: Parsed text")
            os.remove(file_path)
            return json.dumps({"text": abstract})
        else:
            data = parsed_pdf['content']
            logging.info(f"RETURNING: Parsed text")
            os.remove(file_path)
            return json.dumps({"text": data})
    except:
        os.remove(file_path)


def parse_arxiv(url):
    data = requests.get(url)
    html_page = data.content
    soup = BeautifulSoup(html_page, 'html.parser')
    text = soup.find_all("meta")
    for t in text:
        if "name" in t.attrs:
            if t.attrs["name"] == "citation_abstract":
                logging.info("Successfully retrieved ARXIV text")
                return json.dumps({"text": t.attrs["content"]})


def parse_acl(url):
    res = requests.get(url)
    html_page = res.content
    soup = BeautifulSoup(html_page, 'html.parser')
    text = soup.find_all("span")
    for t in text:
        if t.attrs == {}:
            logging.info("Successfully retrieved ACL text")
            return json.dumps({"text": t.text})


@utils_bp.route("/download-examples/<filename>", methods=["GET"])
def download_examples(filename):
    logging.info("Called download-examples route")
    return send_from_directory(EXAMPLES_DIR, filename)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
