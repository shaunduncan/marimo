from django.template import RequestContext
from django.shortcuts import render_to_response

from marimo.views.base import BaseWidget

def main(request):
    return render_to_response('main.html', RequestContext(request))

class test_widget(BaseWidget):
    template = 'hello {{ name }} are you {{ status }}? if not i will {{ action }} you.'
    use_cache = True

    def cache_key(self, *args, **kwargs):
        return 'test_widget:%s' % args[0]

    def cacheable_part(self, context, *args, **kwargs):
        context['name'] = args[0]
        context['status'] = 'blue'
        return context

    def uncacheable_part(self, request, context, *args, **kwargs):
        context['action'] = args[1]
        return context
