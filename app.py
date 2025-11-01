import os
from flask import Flask, send_from_directory, render_template

app = Flask(__name__)

# This route serves your main index.html page
@app.route('/')
def index():
    # render_template will look for 'index.html' in a folder named 'templates'
    # Since your index.html is in the root, we serve it manually.
    return send_from_directory('.', 'index.html')

# This route serves all your other static files (js, css, manifest, etc.)
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    # setLogLevel('Debug') # Uncomment this if you need detailed Flask logs
    app.run(debug=True, host='0.0.0.0', port=5000)

