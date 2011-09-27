from django.conf import settings
from django.core.cache import cache
from django.views.generic.base import View

MARIMO_TIMEOUT = getattr(settings, 'MARIMO_TIMEOUT', 60*60*24)

class BaseWidget(object):
    use_cache = True

    def cacheable(self, context, *args, **kwargs):
        '''Probably should be overridden in subclass'''
        return context

    def uncacheable(self, request, context, *args, **kwargs):
        '''Probably should be overridden in subclass'''
        return context

    def cache_key(self, *args, **kwargs):
        '''Must be overridden in subclass'''
        pass

    def __call__(self, request, *args, **kwargs):
        #TODO: deal with request kwarg
        if self.use_cache:
            cache_key = self.cache_key(*args, **kwargs)
            context = cache.get(cache_key)
            if context is None:
                #TODO: do we want to cache the template?
                context = {'template': self.template}
                context = self.cacheable_part(context, *args, **kwargs)
                cache.set(cache_key, context, MARIMO_TIMEOUT)
        else:
                context = {'template': self.template}
        context = self.uncacheable_part(request, context, *args, **kwargs)
        return context
