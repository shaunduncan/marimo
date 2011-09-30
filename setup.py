from setuptools import setup, find_packages
setup(
    name = "marimo",
    version = "0.1",
    packages = find_packages('py'),
    package_dir = {'': 'py/marimo'},
    py_modules = ['marimo.views'],
    author = "Cox Media Group",
    author_email = "opensource@coxinc.com",
    description = "a fast framework for asynchronous widgets",
    license = "MIT",
    url = "https://github.com/coxmediagroup/marimo",
)

