# Virtual Environment Starting Steps

## 1. Set up the Backend

  Directory: C:\Users\Sean\Projects\Redact-Flow\backend

  Commands:
  (Run these one after the other)

  `
py -3.11 -m venv venv
  `

  `
.\venv\Scripts\activate
  `
  `
pip install -r requirements.txt
  `
  `
python -m spacy download en_core_web_lg
  `

## 2. Set up the Frontend

  Directory: C:\Users\Sean\Projects\Redact-Flow\frontend

  Command:
  `
npm install
  `

## 3. Run the Application

  Directory: C:\Users\Sean\Projects\Redact-Flow\frontend

  Command:
  `
npm start
  `
