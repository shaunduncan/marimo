from django.conf import settings
from django.utils.unittest import TestCase
from django import template
import mock


class TestTag(TestCase):
    def setUp(self):
        self.real_murl = getattr(settings, 'MARIMO_URL', None)
        settings.MARIMO_URL = '/thissite'
        self.context = template.Context()
        request = mock.Mock()
        request.META = dict(PATH_INFO='/some/path')
        self.context['request'] = request
        self.expected1 = """ <div class="marimo class" data-murl="/thissite" data-json="%7B%22resolved_kwargs%22%3A%20%7B%22k2%22%3A%20%22stringkwarg%22%2C%20%22k1%22%3A%20%22incon%22%7D%2C%20%22args%22%3A%20%5B%22incon%22%2C%20%22stringarg%22%5D%2C%20%22widget_name%22%3A%20%22test%22%7D"></div>"""

    def tearDown(self):
        if self.real_murl is None:
            del settings.MARIMO_URL
        else:
            settings.MARIMO_URL = self.real_murl

    def test_tag(self):
        t = template.Template("""{% load marimo %} {% marimo test incontext "stringarg" k1=incontext k2="stringkwarg" %}""")
        self.context['incontext'] = 'incon'
        rendered = t.render(self.context)
        self.assertEqual(rendered, self.expected1)
