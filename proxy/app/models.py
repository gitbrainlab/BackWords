from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SearchMode(str, Enum):
    word = "word"
    phrase = "phrase"
    paragraph = "paragraph"


class Register(str, Enum):
    formal = "formal"
    informal = "informal"
    neutral = "neutral"
    technical = "technical"
    vulgar = "vulgar"
    archaic = "archaic"


class Sentiment(str, Enum):
    positive = "positive"
    negative = "negative"
    neutral = "neutral"


class SentimentShift(str, Enum):
    positive_to_negative = "positive-to-negative"
    negative_to_positive = "negative-to-positive"
    neutral_to_negative = "neutral-to-negative"
    neutral_to_positive = "neutral-to-positive"
    positive_to_neutral = "positive-to-neutral"
    negative_to_neutral = "negative-to-neutral"
    stable = "stable"
    complex = "complex"


class DriftType(str, Enum):
    pejoration = "pejoration"
    amelioration = "amelioration"
    narrowing = "narrowing"
    broadening = "broadening"
    semantic_shift = "semantic-shift"
    stable = "stable"
    reclamation = "reclamation"


class SourceType(str, Enum):
    dictionary = "dictionary"
    literary = "literary"
    academic = "academic"
    historical = "historical"
    newspaper = "newspaper"
    other = "other"


class WorkType(str, Enum):
    novel = "novel"
    poetry = "poetry"
    play = "play"
    essay = "essay"
    dictionary = "dictionary"
    journal = "journal"
    film = "film"
    song = "song"
    other = "other"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class SnapshotInterpretation(BaseModel):
    snapshotId: str
    date: str
    eraLabel: str
    definition: str
    usageNote: str
    exampleUsage: str
    register: Register
    sentiment: Sentiment
    confidence: float = Field(ge=0.0, le=1.0)
    sourceIds: list[str] = []


class SummaryOfChange(BaseModel):
    shortSummary: str
    longSummary: str
    sentimentShift: str
    driftType: str
    driftMagnitude: float = Field(ge=0.0, le=1.0)


class KeyDate(BaseModel):
    date: str
    label: str
    significance: str


class SourceCitation(BaseModel):
    sourceId: str
    title: str
    author: str | None = None
    publisher: str | None = None
    publishedDate: str | None = None
    sourceType: SourceType
    attribution: str
    excerpt: str
    relevanceNote: str
    confidence: float = Field(ge=0.0, le=1.0)


class WorkLink(BaseModel):
    label: str
    url: str


class RelatedWork(BaseModel):
    workId: str
    title: str
    creator: str | None = None
    year: int | None = None
    workType: WorkType
    whyRelevant: str
    publicDomainHint: bool
    links: list[WorkLink] = []


class RelatedPage(BaseModel):
    pageId: str
    title: str
    slug: str
    summary: str
    route: str
    tags: list[str] = []


class RelatedConcept(BaseModel):
    conceptId: str
    label: str
    relationship: str
    note: str | None = None


class PassageHighlight(BaseModel):
    highlightId: str
    start: int
    end: int
    text: str
    conceptId: str
    label: str
    confidence: float = Field(ge=0.0, le=1.0)


class Passage(BaseModel):
    originalText: str
    modernParaphrase: str | None = None
    highlights: list[PassageHighlight] = []


class TimelineEvent(BaseModel):
    eventId: str
    date: str
    eraLabel: str
    title: str
    summary: str
    relatedSnapshotId: str | None = None
    sourceIds: list[str] = []


class ClientContext(BaseModel):
    appVersion: str | None = None
    locale: str | None = None
    deviceId: str | None = None


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class InterpretationRequest(BaseModel):
    query: str = Field(min_length=1, max_length=5000)
    mode: SearchMode
    selectedDate: str | None = None
    clientContext: ClientContext | None = None


class ExplainSourceRequest(BaseModel):
    sourceId: str
    query: str
    snapshotId: str
    clientContext: ClientContext | None = None


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class InterpretationResult(BaseModel):
    lexemeId: str
    query: str
    normalizedQuery: str
    requestedDate: str | None = None
    resolvedEraLabel: str | None = None
    currentSnapshot: SnapshotInterpretation
    selectedSnapshot: SnapshotInterpretation | None = None
    historicalSnapshots: list[SnapshotInterpretation] = []
    summaryOfChange: SummaryOfChange
    keyDates: list[KeyDate] = []
    sources: list[SourceCitation] = []
    relatedWorks: list[RelatedWork] = []
    relatedPages: list[RelatedPage] = []
    relatedConcepts: list[RelatedConcept] = []
    ambiguityNotes: list[str] = []
    passage: Passage | None = None
    timelineEvents: list[TimelineEvent] = []
    generatedAt: str
    modelVersion: str


class ExplainSourceResponse(BaseModel):
    sourceId: str
    explanation: str
    supportingQuotes: list[str] = []
    confidenceNarrative: str
    generatedAt: str


class HealthResponse(BaseModel):
    status: str
    version: str
    seedCount: int
