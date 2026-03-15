from __future__ import annotations

import logging
from datetime import datetime, timezone

from .data_loader import DataLoader
from .models import (
    ExplainSourceRequest,
    ExplainSourceResponse,
    InterpretationRequest,
    InterpretationResult,
    KeyDate,
    Passage,
    PassageHighlight,
    RelatedConcept,
    RelatedPage,
    RelatedWork,
    SnapshotInterpretation,
    SourceCitation,
    SummaryOfChange,
    TimelineEvent,
    WorkLink,
)

logger = logging.getLogger(__name__)

_GENERIC_RESULT_TEMPLATE = {
    "lexemeId": "unknown",
    "query": "",
    "normalizedQuery": "",
    "currentSnapshot": {
        "snapshotId": "generic_current",
        "date": "2024-01-01",
        "eraLabel": "Contemporary",
        "definition": "No seeded interpretation found. Add a seed file to data/seed/ to enable rich results.",
        "usageNote": "This is a placeholder response.",
        "exampleUsage": "No example available.",
        "register": "neutral",
        "sentiment": "neutral",
        "confidence": 0.1,
        "sourceIds": [],
    },
    "historicalSnapshots": [],
    "summaryOfChange": {
        "shortSummary": "No historical data available for this query.",
        "longSummary": "Add a seed JSON file to data/seed/ to provide historical interpretation data.",
        "sentimentShift": "stable",
        "driftType": "stable",
        "driftMagnitude": 0.0,
    },
    "keyDates": [],
    "sources": [],
    "relatedWorks": [],
    "relatedPages": [],
    "relatedConcepts": [],
    "ambiguityNotes": [],
    "timelineEvents": [],
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _build_snapshot(raw: dict) -> SnapshotInterpretation:
    return SnapshotInterpretation(**raw)


def _build_summary(raw: dict) -> SummaryOfChange:
    return SummaryOfChange(**raw)


def _build_source(raw: dict) -> SourceCitation:
    return SourceCitation(**raw)


def _build_related_work(raw: dict) -> RelatedWork:
    links = [WorkLink(**lnk) for lnk in raw.get("links", [])]
    return RelatedWork(**{**raw, "links": links})


def _build_related_page(raw: dict) -> RelatedPage:
    return RelatedPage(**raw)


def _build_concept(raw: dict) -> RelatedConcept:
    return RelatedConcept(**raw)


def _build_key_date(raw: dict) -> KeyDate:
    return KeyDate(**raw)


def _build_timeline_event(raw: dict) -> TimelineEvent:
    return TimelineEvent(**raw)


def _build_passage(raw: dict | None) -> Passage | None:
    if not raw:
        return None
    highlights = [PassageHighlight(**h) for h in raw.get("highlights", [])]
    return Passage(
        originalText=raw["originalText"],
        modernParaphrase=raw.get("modernParaphrase"),
        highlights=highlights,
    )


class MockEngine:
    """
    Serves interpretations from seeded JSON data.

    TODO: real provider — replace interpret() and explain_source() with calls
    to an LLM API (OpenAI, Anthropic, etc.) and map the response to the
    InterpretationResult / ExplainSourceResponse models.
    """

    def __init__(self, loader: DataLoader, model_version: str = "mock-seed-v1") -> None:
        self._loader = loader
        self._model_version = model_version

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def interpret(self, request: InterpretationRequest) -> InterpretationResult:
        """
        Look up the query in seed data and build a full InterpretationResult.
        Falls back to a generic placeholder if no seed is found.
        """
        seed = self._loader.get_seed(request.query)

        if seed is None:
            logger.info("No seed found for '%s', returning generic placeholder", request.query)
            return self._generic_result(request)

        # TODO: real provider — call LLM here with seed as context/grounding
        return self._result_from_seed(seed, request)

    def explain_source(self, request: ExplainSourceRequest) -> ExplainSourceResponse:
        """
        Return a mock explanation for why a source supports an interpretation.

        TODO: real provider — call LLM here with source + snapshot context
        """
        seed = self._loader.get_seed(request.query)
        source_data = None

        if seed:
            for s in seed.get("sources", []):
                if s["sourceId"] == request.sourceId:
                    source_data = s
                    break

        if source_data:
            explanation = (
                f"The source '{source_data['title']}' supports the interpretation of "
                f"'{request.query}' because: {source_data['relevanceNote']} "
                f"The relevant excerpt reads: \"{source_data['excerpt']}\""
            )
            confidence_narrative = (
                f"Confidence {source_data['confidence']:.0%} — "
                + ("High confidence: primary scholarly authority." if source_data["confidence"] >= 0.9
                   else "Moderate confidence: corroborating evidence." if source_data["confidence"] >= 0.7
                   else "Lower confidence: supplementary context only.")
            )
            supporting_quotes: list[str] = []
        else:
            explanation = (
                f"No detailed source data found for sourceId '{request.sourceId}'. "
                "This source supports the interpretation based on its documented historical usage."
            )
            confidence_narrative = "Confidence not available for this source."
            supporting_quotes = []

        return ExplainSourceResponse(
            sourceId=request.sourceId,
            explanation=explanation,
            supportingQuotes=supporting_quotes,
            confidenceNarrative=confidence_narrative,
            generatedAt=_now_iso(),
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _result_from_seed(
        self,
        seed: dict,
        request: InterpretationRequest,
    ) -> InterpretationResult:
        selected_snapshot = self._loader.get_closest_snapshot(seed, request.selectedDate)
        resolved_era = selected_snapshot.get("eraLabel") if request.selectedDate else None

        max_sources = 10  # proxy returns all; iOS client trims to settings.maxSources
        sources = [_build_source(s) for s in seed.get("sources", [])[:max_sources]]

        return InterpretationResult(
            lexemeId=seed.get("lexemeId", seed.get("normalizedQuery", "")),
            query=seed.get("query", request.query),
            normalizedQuery=seed.get("normalizedQuery", request.query.lower().strip()),
            requestedDate=request.selectedDate,
            resolvedEraLabel=resolved_era,
            currentSnapshot=_build_snapshot(seed["currentSnapshot"]),
            selectedSnapshot=_build_snapshot(selected_snapshot) if request.selectedDate else None,
            historicalSnapshots=[_build_snapshot(s) for s in seed.get("historicalSnapshots", [])],
            summaryOfChange=_build_summary(seed["summaryOfChange"]),
            keyDates=[_build_key_date(kd) for kd in seed.get("keyDates", [])],
            sources=sources,
            relatedWorks=[_build_related_work(rw) for rw in seed.get("relatedWorks", [])],
            relatedPages=[_build_related_page(rp) for rp in seed.get("relatedPages", [])],
            relatedConcepts=[_build_concept(rc) for rc in seed.get("relatedConcepts", [])],
            ambiguityNotes=seed.get("ambiguityNotes", []),
            passage=_build_passage(seed.get("passage")),
            timelineEvents=[_build_timeline_event(te) for te in seed.get("timelineEvents", [])],
            generatedAt=_now_iso(),
            modelVersion=self._model_version,
        )

    def _generic_result(self, request: InterpretationRequest) -> InterpretationResult:
        template = dict(_GENERIC_RESULT_TEMPLATE)
        template["query"] = request.query
        template["normalizedQuery"] = request.query.lower().strip()
        template["lexemeId"] = request.query.lower().strip()

        current_raw = dict(template["currentSnapshot"])
        current_raw["definition"] = (
            f"No seeded interpretation found for '{request.query}'. "
            "Add a seed file to data/seed/ to enable rich results."
        )

        return InterpretationResult(
            lexemeId=template["lexemeId"],
            query=template["query"],
            normalizedQuery=template["normalizedQuery"],
            requestedDate=request.selectedDate,
            resolvedEraLabel=None,
            currentSnapshot=SnapshotInterpretation(**current_raw),
            selectedSnapshot=None,
            historicalSnapshots=[],
            summaryOfChange=SummaryOfChange(**template["summaryOfChange"]),
            keyDates=[],
            sources=[],
            relatedWorks=[],
            relatedPages=[],
            relatedConcepts=[],
            ambiguityNotes=[f"No seed data found for '{request.query}'."],
            passage=None,
            timelineEvents=[],
            generatedAt=_now_iso(),
            modelVersion=self._model_version,
        )
