import os
from django.conf import settings

class TemplateNotFound(Exception):
    pass

class TemplateLoader(object):

    def __init__(self):
        self.template_dirs = getattr(settings, 'MARIMO_TEMPLATE_DIRS', [])
        self._templates = {}

    def load(self, path):
        try:
            return self._templates[path]
        except KeyError:
            for directory in self.template_dirs:
                full = os.path.join(directory, path)
                try:
                    fh = open(full)
                except IOError:
                    pass
                else:
                    self._templates[path] = fh.read()
                    fh.close()
                    return self._templates[path]
        raise TemplateNotFound('No such template: %s' % path)

template_loader = TemplateLoader()
