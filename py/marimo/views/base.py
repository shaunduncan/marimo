"""
BaseWidget is the a base class that can be extended to make marimo widget handlers 
"""
from django.conf import settings
from django.core.cache import cache

MARIMO_TIMEOUT = getattr(settings, 'MARIMO_TIMEOUT', 60*60*24)

class BaseWidget(object):
    """
    Extend BaseWidget to make marimo widget handlers.
    template: the template that this widget will use
    use_cache:  If nothing is cacheable in your handler set this to false and don't define a cacheable method
    cacheable:  This should accept a dictionary argument *args and **kwargs.  
                Everything in this part will be cached using your cache_key method
    uncacheable: This takes a dictionary and will modify it with uncacheable information
    cache_key:  This is they key 

    """
    # TODO: make this a view by wrapping the __call__
    # TODO: everything seems stateless should these be classmethods?

    use_cache = True

    def cacheable(self, context, *args, **kwargs):
        """
        Should be overriden in subclasses if use_cache=True
        should update context with cacheable information and return it
        """
        return context

    def uncacheable(self, request, context, *args, **kwargs):
        """
        should update context based on request specific information and return it
        """
        return context

    def cache_key(self, *args, **kwargs):
        """
        Must be overridden in subclass if use_cache=True
        Generates the cache key that this widget will use based on  *args and **kwargs
        """
        raise NotImplementedError
    
    def update_cache(self, *args, **kwargs):
        """ call this with *args and **kwargs like a request to update the cache """
        cache_key = self.cache_key(*args, **kwargs)
        context = self.cacheable(dict(), *args, **kwargs)
        cache.set(cache_key, context, MARIMO_TIMEOUT)
        return context

    def __call__(self, request, *args, **kwargs):
        """ 
        Splits up work into cachable and uncacheable parts 
        """
            
        if self.use_cache:
            cache_key = self.cache_key(*args, **kwargs)
            context = cache.get(cache_key)
            if context is None:
                #TODO: do we want to cache the template?
                context = self.update_cache(*args, **kwargs)
        else:
                context = {}
        context = self.uncacheable(request, context, *args, **kwargs)
        return {'context':context, 'template':self.template}
