import json

from django.conf import settings
from django.http import Http404, HttpResponse
from django.views.generic.base import View

from marimo.utils import smart_import

_marimo_widgets = smart_import(settings.MARIMO_REGISTRY)


class MarimoRouter(View):
    """
    MarimoRouter splits up the request into individual widget packages and
    sends them to the handlers defined int he MARIMO_REGISTY
    """

    def get(self, request):
        """ for a get request the bulk data is in request.GET """
        try:
            bulk = json.loads(request.GET['bulk'])
        except KeyError:
            raise Http404()
        else:
            return self.route(request, bulk)

    def route(self, request, bulk):
        """ this actually does the routing """
        response = []
        # TODO sanitize bulk
        for widget in bulk:
            # Try to get a callable from the dict... if it's not imported deal with it
            view = _marimo_widgets[widget['widget_name']]
            if not callable(view):
                view = smart_import(view)()
                _marimo_widgets[widget['widget_name']] = view
            data = { 'div_id': widget['div_id'], }
            #try:
            data.update(view(request, *widget['args'], **widget['kwargs'])) 
            #except: #TODO: needs better error handling
            #    data['status'] = 'failed'
            #else:
            #    data['status'] = 'succeeded'
            response.append(data)
        return HttpResponse(json.dumps(response), mimetype='application/json')
