import json

MARIMO_PLACEHOLDER = "${MARIMO}"

class Marimo(object):

    def process_request(self, request):
        request.marimo_widgets = []

    def process_response(self, request, response):
        code = "<script> marimo.add_widgets(%s); </script>" %json.dumps(request.marimo_widgets)
        response.content = response.content.replace(MARIMO_PLACEHOLDER, code)
        return response

def context_processor(request):
    return { 'marimo_widgets' : request.marimo_widgets }
