# CLS Platform

The presented CLS Platform is designed to be either installed as a web application running on a server or as a local executed desktop application that is opened inside a browser.

Pre-requisties for running the application is a Linux or Windows OS with installed Python version 3.7 or higher, installed Java JDK version 8 or higher, and a JavaScript compatible internet browser, like Chrome, Firefox, Safari or Microsoft Edge. Additionally, at least 50 Gigabytes of free memory are required during the installation process. When the installation is finished, the application requires 31 Gigabyte memory space.

## References

Parts of this work are based on the paper "[TLDR: Extreme Summarization of Scientific Documents](https://aclanthology.org/2020.findings-emnlp.428/)" by Cachola et al..
The application is created in terms of the Master Thesis of Niklas Friedrich at the Data and Web Science Group of the Univeristy of Mannheim, supervised by Prof. Dr. Simone Paolo Ponzetto.

## Download Data

For downloading all model data that is included per default to the app, execute the command "install_models.py --download-all" after the requirements are installed. The cross-lingual TLDR generation models need to be downloaded from the following link, unzipped and moved to the models directory: https://tinyurl.com/cl-models

## Installation Manual

### Desktop Application:

To install the CLS platform on a local machine in the "Desktop"-mode, perform the following steps in the backend directory:

1. Set the .env file according to your needs
2. pip install -r requirements.txt
3. python app.py
4. A new browser window will be opened automatically through the application. Is this not the case, plese open your internet browser and access the site: "http://localhost:7297".

Alternatively, the app can be started using docker. A dockerfile is included in the base directory. Simply access the directory and run the command "docker build . --tag cls \&\& docker run -p 7297:7297 cls". This builds a running docker container image and starts it on the local machine. When the container successfully started, the application is accessible via the browser opening the site "http://localhost:7297".

### Web Application:

For installation as a web application, additionally node.js needs to be installed on the system to re-build the front-end application. The web version uses per default gunicorn as wsgi server. For running on Windows machines, please use another WSGI server.

For installation, execute the following steps:

1. Enter the "frontend" directory inside the cls platform directory.
2. Run the command "npm install". This will install all in the project included dependencies, like react.js and socket.io.
3. Set the values inside the .env file according to your server settings. The variable "REACT_APP_BACKEND_URL" needs to point to the web addresse and the desired port number or the ip addresse and the desired port number of the used server. The second variable "REACT_APP_ENVIRONMENT" needs to be set to "WEB" to enable memory restrictions.
4. Run the command "npm run build". This will build the optimized production build into the folder build.
5. Copy the new created build folder into the backend directory of the CLS Platform. Depending on the use, name it either as "build-desktop" or "build-web".
6. Access the .env file of the backend directory and adapt the values to your needs. Ensure that the port number inside this file matches the previous chosen port number.
7. In the backend directory, run the command "pip3 install -r requirments.txt".
8. Start the application under Linux with the command "gunicorn -w 1 --threads 10 -b :7297 wsgi:app".
