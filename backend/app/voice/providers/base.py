"""Shared provider errors for voice cascade."""

from __future__ import annotations


class VoiceProviderError(Exception):
    """Vendor failure, missing key, or empty result."""

    def __init__(self, provider: str, message: str) -> None:
        self.provider = provider
        super().__init__(message)


class VoiceConfigurationError(VoiceProviderError):
    """API key or required env is missing."""


class VoiceUpstreamError(VoiceProviderError):
    """HTTP or vendor returned an error response."""


class VoiceEmptyResultError(VoiceProviderError):
    """Vendor succeeded but returned no usable transcript or audio."""
