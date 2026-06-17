"""Nox sessions for the MyST Listing plugin."""

import nox

# Use uv for faster installs
nox.options.default_venv_backend = "uv|virtualenv"


@nox.session(name="build")
def build_plugin(session):
    """Build the plugin bundle (docs reference it at ../dist/plugin.mjs)."""
    session.run("npm", "install", external=True)
    session.run("npm", "run", "build", external=True)


@nox.session(name="test")
def test(session):
    """Build docs then run the vitest suite against the output."""
    build_plugin(session)
    session.run("npm", "test", external=True)


@nox.session()
def docs(session):
    """Build the HTML of the documentation (builds the plugin first)."""
    session.install("mystmd")
    build_plugin(session)
    session.chdir("docs")
    session.run("myst", "build", "--html")


@nox.session(name="docs-live")
def docs_live(session):
    """Start a live docs server (builds the plugin first)."""
    session.install("mystmd")
    build_plugin(session)
    session.chdir("docs")
    session.run("myst", "start")
