"""SparkMonitor Jupyter Web Server Extension

This module adds a custom request handler to Jupyter web server.
It proxies the Spark Web UI by default running at 127.0.0.1:4040
to the endpoint notebook_base_url/sparkmonitor

TODO Create unique endpoints for different kernels or spark applications.
"""
import json
import os
import re

from bs4 import BeautifulSoup
from notebook.base.handlers import IPythonHandler, APIHandler
from notebook.utils import url_path_join
from tornado import httpclient
from tornado import web


try:
    import lxml
except ImportError:
    BEAUTIFULSOUP_BUILDER = "html.parser"
else:
    BEAUTIFULSOUP_BUILDER = "lxml"
# a regular expression to match paths against the Spark on EMR proxy paths
PROXY_PATH_RE = re.compile(r"\/proxy\/application_\d+_\d+\/(.*)")
# a tuple of tuples with tag names and their attribute to automatically fix
PROXY_ATTRIBUTES = (
    (("a", "link"), "href"),
    (("img", "script"), "src"),
)

PROXY_ROOT = "/sparkuitab"


class SparkContextsHandler(APIHandler):
    """Receive currently runing spark contexts"""

    @web.authenticated
    async def get(self):
        monitors = await self.find_running_monitors()
        self.finish(json.dumps(monitors))

    async def find_running_monitors(self):
        opened_ports = []
        http = httpclient.AsyncHTTPClient()
        base_url = os.environ.get("SPARKMONITOR_UI_HOST", "127.0.0.1")
        port = os.environ.get("SPARKMONITOR_UI_PORT", "4040")
        port = int(port)
        for i in range(port, port + 100):
            url = "http://{}:{}/api/v1/applications".format(base_url, i)
            try:
                response = await http.fetch(url)
                response = json.loads(response.body)
                opened_ports.append({i, response[0]["name"]})
            except:
                self.log.debug("Port {} is not opened".format(i))
        return opened_ports


class SparkMonitorHandler(IPythonHandler):
    """A custom tornado request handler to proxy Spark Web UI requests."""

    @web.authenticated
    async def get(self):
        """Handles get requests to the Spark UI

        Fetches the Spark Web UI from the configured ports
        """
        http = httpclient.AsyncHTTPClient()
        base_url = os.environ.get("SPARKMONITOR_UI_HOST", "127.0.0.1")
        port = os.environ.get("SPARKMONITOR_UI_PORT", "4040")
        url = "http://" + base_url + ":" + port
        request_path = self.request.uri[(self.request.uri.index(PROXY_ROOT) + len(PROXY_ROOT) + 1):]
        replace_path = self.request.uri[:self.request.uri.index(
            PROXY_ROOT) + len(PROXY_ROOT)]

        backend_url = url_path_join(url, request_path)
        try:
            x = await http.fetch(backend_url)
            self.handle_response(x, replace_path)
        except:
            self.handle_bad_response()

    def handle_bad_response(self):
        content_type = "text/html"

        try:
            with open(os.path.join(os.path.dirname(__file__), "spark_not_found.html"), 'r') as f:
                content = f.read()
                self.set_header("Content-Type", content_type)
                self.write(content)
                self.finish()
            self.log.debug("SPARKMONITOR_SERVER: Spark UI not running")
        except FileNotFoundError:
            self.log.warn("default html file was not found")

    def handle_response(self, response, replace_path):
        try:
            content_type = response.headers["Content-Type"]
            if "text/html" in content_type:
                content = self.replace(response.body, replace_path)
            elif "javascript" in content_type:
                body = "location.origin +'" + replace_path + "' "
                content = response.body.replace(b"location.origin", body.encode())
            else:
                # Probably binary response, send it directly.
                content = response.body
            self.set_header("Content-Type", content_type)
            self.write(content)
            self.finish()
        except Exception as e:
            self.log.error(str(e))
            raise e

    def replace(self, content, root_url):
        """Replace all the links with our prefixed handler links,

         e.g.:
        /proxy/application_1467283586194_0015/static/styles.css" or
        /static/styles.css
        with
        /spark/static/styles.css
        """
        soup = BeautifulSoup(content, BEAUTIFULSOUP_BUILDER)
        for tags, attribute in PROXY_ATTRIBUTES:
            for tag in soup.find_all(tags, **{attribute: True}):
                value = tag[attribute]
                match = PROXY_PATH_RE.match(value)
                if match is not None:
                    value = match.groups()[0]
                tag[attribute] = url_path_join(root_url, value)
        return str(soup)


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the Jupyter server extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings["base_url"]
    handlers = [(PROXY_ROOT + ".*", SparkMonitorHandler),
                ("spark_contexts", SparkContextsHandler)]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]
    web_app.add_handlers(".*$", handlers)


