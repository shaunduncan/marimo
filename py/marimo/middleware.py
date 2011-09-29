import json

MARIMO_PLACEHOLDER = "${MARIMO}"

class Marimo(object):
    """ 
    a simple middleware to register all widgets during page generation
    and add a script to load them where "${MARIMO}" is in the page
    """
    def process_request(self, request):
        """ sticks marimo_widgets in the request """
        request.marimo_widgets = []

    def process_response(self, request, response):
        """ generates a script to register and load the widgets with marimo """
        # TODO: check to maker sure the placeholder exists
        # TODO: add_widgets shouldn't make the request
        code = "<script> marimo.add_widgets(%s); </script>" %json.dumps(request.marimo_widgets)
        response.content = response.content.replace(MARIMO_PLACEHOLDER, code)
        return response

def context_processor(request):
    """ sticks marimo_widgets into the template context """
    return { 'marimo_widgets' : request.marimo_widgets }
