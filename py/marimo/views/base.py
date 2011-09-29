from django.conf import settings
from django.core.cache import cache

MARIMO_TIMEOUT = getattr(settings, 'MARIMO_TIMEOUT', 60*60*24)

class BaseWidget(object):
    # TODO: make this a view by wrapping the __call__
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
        """ 
        Splits up work into cachable and uncacheable parts 
        """
            
        if self.use_cache:
            cache_key = self.cache_key(*args, **kwargs)
            context = cache.get(cache_key)
            if context is None:
                #TODO: do we want to cache the template?
                context = {}
                context = self.cacheable_part(context, *args, **kwargs)
                cache.set(cache_key, context, MARIMO_TIMEOUT)
        else:
                context = {'template': self.template}
        context = self.uncacheable_part(request, context, *args, **kwargs)
        return {'context':context, 'template':self.template}
