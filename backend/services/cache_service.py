from functools import lru_cache

@lru_cache(maxsize=100)
def cache_result(key, result):
    return result

def get_cached_result(key):
    return cache_result(key, None)