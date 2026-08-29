"""PEM shape diagnostics and private-key newline unescaping."""

from __future__ import annotations

from app.core.config import Settings, pem_shape_diagnostics

_DUMMY_BODY = "TESTDUMMYKEYNOTSECRET"
_DUMMY_PEM = (
    "-----BEGIN PRIVATE KEY-----\n"
    f"{_DUMMY_BODY}\n"
    "-----END PRIVATE KEY-----\n"
)


def test_pem_shape_diagnostics_reports_flags_not_key_body():
    diag = pem_shape_diagnostics(_DUMMY_PEM)
    assert "has_begin_private_key=True" in diag
    assert "newline_count=3" in diag
    assert f"length={len(_DUMMY_PEM)}" in diag
    assert diag != _DUMMY_PEM
    assert _DUMMY_BODY not in diag


def test_pem_shape_diagnostics_false_begin_without_header():
    dummy = "not-a-pem-blob"
    diag = pem_shape_diagnostics(dummy)
    assert "has_begin_private_key=False" in diag
    assert "newline_count=0" in diag
    assert f"length={len(dummy)}" in diag
    assert dummy not in diag


def test_unescape_strips_quoted_wrapping():
    wrapped = (
        '"-----BEGIN PRIVATE KEY-----\\n'
        f"{_DUMMY_BODY}\\n"
        '-----END PRIVATE KEY-----\\n"'
    )
    assert Settings.unescape_private_key_newlines(wrapped) == _DUMMY_PEM
    trailing_nl = wrapped + "\n"
    assert Settings.unescape_private_key_newlines(trailing_nl) == _DUMMY_PEM


def test_unescape_turns_escaped_n_into_newlines():
    raw = "line1\\nline2\\n"
    assert Settings.unescape_private_key_newlines(raw) == "line1\nline2\n"


def test_unescape_normalizes_crlf_variants_to_lf():
    assert Settings.unescape_private_key_newlines("a\\r\\nb") == "a\nb"
    assert Settings.unescape_private_key_newlines("a\r\nb") == "a\nb"
    assert Settings.unescape_private_key_newlines("a\rb") == "a\nb"


def test_settings_construct_unescapes_explicit_key():
    wrapped = (
        "'-----BEGIN PRIVATE KEY-----\\n"
        f"{_DUMMY_BODY}\\n"
        "-----END PRIVATE KEY-----\\n'"
    )
    settings = Settings(firebase_private_key=wrapped, _env_file=None)
    assert settings.firebase_private_key == _DUMMY_PEM
    assert _DUMMY_BODY in settings.firebase_private_key
