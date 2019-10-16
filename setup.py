#!/usr/bin/env python

from setuptools import setup, find_packages
from subprocess import check_output

setup(name='jupyterlab-spark-ui-tab',
      version="0.0.2",
      description='Spark UI extension for JupyterLab',
      author='Lior Baber',
      author_email='liorbaber@gmail.com',
      include_package_data=True,
      packages=find_packages(),
      license="apache-2.0",
      url='https://github.com/s22s/jupyterlab-spark-ui-tab',
      keywords=['jupyter', 'extension', 'spark'],
      classifiers=[
          'Intended Audience :: Developers',
          'License :: OSI Approved :: Apache Software License',
          'Programming Language :: Python :: 3',
      ],
      zip_safe=False,
      install_requires=[
          'bs4',
      ]
      )
