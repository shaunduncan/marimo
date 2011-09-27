import json
import random
import urllib

from django import template
from django.conf import settings

register = template.Library()

@register.tag(name="marimo")
def marimo(parser, token):
    """
        Syntax::
            {% marimo widget_name [murl=http://some.url.com] [args] [kwargs] %}

        Examples::
            {% marimo comments objectpk=23 %}
    """
    tokens = token.split_contents()
    if len(tokens) < 2:
        raise template.TemplateSyntaxError('Need at least a widget name')

    tokens.pop(0)
    widget_name = tokens.pop(0)
    args = []
    kwargs = {}

    for token in tokens:
        parts = token.split('=')
        if len(parts) == 1:
            args.append(parts[0])
        elif len(parts) == 2:
            kwargs[parts[0]] = parts[1]
        else:
            raise template.TemplateSyntaxError('Arguments cannot contain =')

    return MarimoNode(widget_name, args, kwargs)

class MarimoNode(template.Node):
    def __init__(self, widget_name, args, kwargs):
        self.widget_name = widget_name
        self.args = args
        self.kwargs = kwargs

    def render(self, context):
        if hasattr(self.kwargs, 'murl'):
            murl = self.kwargs.pop('murl')
        else:
            murl = settings.MARIMO_URL

        def maybe_resolve(arg):
            if arg[0] == '"' and arg[-1] == '"':
                return arg.strip('"')
            else:
                var = template.Variable(arg)
                return str(var.resolve(context))

        data = {}
        data['kwargs'] = {}
        for (k,v) in self.kwargs.items():
            data['kwargs'][k] = maybe_resolve(v)
        data['args'] = [maybe_resolve(arg) for arg in self.args]
        data['widget_name'] = self.widget_name
        data['div_id'] = self.generate_div_id()
        data['murl'] = murl

        divstr = '<div id="{div_id}" class="{cls}"></div>'.format(
           cls = getattr(settings, 'MARIMO_CLASS', 'marimo class'),
           div_id = data['div_id']
        )
        # TODO this is what needs to get written out by middleware...into head
        if (getattr(settings, 'MARIMO_FAST', False)):
            context['marimo_widgets'].append(data)
            script = ''
        else:
            script = '<script> marimo.add_widget(%s); </script>' % json.dumps(data)

        return divstr + script

    def generate_div_id(self):
        # hopefully this is adequate
        return '%s_%s' % (self.widget_name, str(random.randint(0,999999)))
