marimo Backend API
==================
marimo provides a "request_widget" that can ask for a template and template
context from a backend that implements a simple api. These requests are batched
through the batch_request object, which combines multiple widget requests to a
single URL into one request. The simplest backend implementation would look
something like this:::

    GET /marimo/?bulk=[{"id":"eg_1","widget_prototype":"request_widget","args":[],"kwargs":{}]
    RESPONSE [{"id":"eg_1","template":"a {{adjective}} mustache template","context":{"adjective":"simple"}}]

Currently the only completed backend for request_widgets is django-marimo_. See
marimo.views for an example of how the bulk widget data request is split up,
routed, and re-combined.

.. _django-marimo: http://github.com/coxmediagroup/django-marimo
