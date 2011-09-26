from django.template import RequestContext
from django.shortcuts import render_to_response

def main(request):
    return render_to_response('main.html', RequestContext(request))
