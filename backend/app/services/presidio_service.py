import logging
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from presidio_analyzer import AnalyzerEngine, RecognizerResult
from presidio_anonymizer import AnonymizerEngine

logger = logging.getLogger(__name__)


class PresidioService:
    """
    Service for interacting with Microsoft Presidio for PII detection and anonymization.
    """

    def __init__(self, supported_entities: List[str]):
        # --- Phase 4: Advanced Conflict Resolution and Recognizer Tuning ---
        from presidio_analyzer.recognizer_registry import RecognizerRegistry
        from presidio_analyzer.pattern import Pattern
        from presidio_analyzer.pattern_recognizer import PatternRecognizer

        registry = RecognizerRegistry()
        registry.load_predefined_recognizers(languages=["en"])

        # -- 4.3: Fine-Tune the Recognizer Registry --
        # Remove recognizers that cause false positives on numeric data.
        registry.remove_recognizer("UsLicenseRecognizer")
        registry.remove_recognizer("UsPassportRecognizer")

        # Add a custom recognizer for 9-digit bank account numbers with a higher score.
        bank_acct_pattern = Pattern(name="Bank Account Pattern (9 digits)", regex=r"\b\d{9}\b", score=0.99) # Score increased
        custom_bank_acct_recognizer = PatternRecognizer(
            supported_entity="US_BANK_ACCOUNT_NUMBER",
            patterns=[bank_acct_pattern],
            name="Custom Bank Account Recognizer"
        )
        registry.add_recognizer(custom_bank_acct_recognizer)

        # Initialize the AnalyzerEngine with our custom registry
        try:
            self.analyzer = AnalyzerEngine(registry=registry, supported_languages=["en"])
        except Exception as e:
            logger.error(f"Error initializing Presidio AnalyzerEngine: {e}")
            raise # Re-raise to ensure startup failure is propagated

        self.anonymizer = AnonymizerEngine()
        self.supported_entities = supported_entities
        logger.info(f"PresidioService initialized with custom recognizer registry.")

    def _resolve_conflicts(self, results: List[RecognizerResult]) -> List[RecognizerResult]:
        """
        Resolves overlapping recognizer results by keeping the one with the highest score.
        """
        if not results:
            return []

        # Sort by start position, then by score descending to prioritize higher scores in case of a tie in position
        sorted_results = sorted(results, key=lambda r: (r.start, -r.score))

        filtered_results = []
        last_result = None

        for result in sorted_results:
            if last_result is None:
                filtered_results.append(result)
                last_result = result
                continue

            # Check for overlap
            if result.start >= last_result.end:
                # No overlap, add the result
                filtered_results.append(result)
                last_result = result
            else:
                # Overlap detected. The list is sorted by score, so the `last_result`
                # which came first at this position, is the one to keep.
                logger.debug(f"Conflict detected. Ignoring '{result.entity_type}' which overlaps with '{last_result.entity_type}'.")
        
        return filtered_results

    def analyze_text(self, text: str, entities: Optional[List[str]] = None) -> List[RecognizerResult]:
        """
        Analyzes text for PII, resolving any conflicting/overlapping entities.
        """
        if not text:
            return []

        if entities is None:
            entities = self.supported_entities

        try:
            # 1. Get all potential results from the analyzer
            initial_results = self.analyzer.analyze(text=text, entities=entities, language='en')
            logger.debug(f"Analyzed text and found {len(initial_results)} initial entities.")

            # 2. Resolve conflicts to get a clean list
            final_results = self._resolve_conflicts(initial_results)
            logger.debug(f"After conflict resolution, {len(final_results)} entities remain.")
            
            return final_results

        except Exception as e:
            logger.error(f"An error occurred during text analysis: {e}")
            # Return an empty list or re-raise, depending on desired failure behavior.
            # For service stability, returning an empty list is safer.
            return []

    def filter_results_by_token(self, original_text: str, existing_results: List[Dict], token_to_remove: str, token_mapping: Dict[str, Dict]) -> List[RecognizerResult]:
        """
        Filters out the RecognizerResult that corresponds to a specific token.
        This is used when reverting a token back to its original value.
        
        Args:
            original_text: The original document text
            existing_results: List of existing result dictionaries
            token_to_remove: The token string to remove (e.g., '[PERSON_1]')
            token_mapping: The current token mapping to find the original value
        
        Returns:
            List[RecognizerResult]: Filtered list of recognizer results
        """
        if token_to_remove not in token_mapping:
            logger.warning(f"Token {token_to_remove} not found in token mapping.")
            return [RecognizerResult(
                entity_type=res_dict["entity_type"],
                start=res_dict["start"],
                end=res_dict["end"],
                score=res_dict["score"],
            ) for res_dict in existing_results]
        
        original_value = token_mapping[token_to_remove]["original_value"]
        
        # Convert existing_results (List[Dict]) to List[RecognizerResult], excluding the token to revert
        filtered_results = []
        for res_dict in existing_results:
            text_span = original_text[res_dict["start"]:res_dict["end"]]
            # Skip the result that matches the original value of the token we're reverting
            if text_span == original_value:
                logger.debug(f"Filtering out result for token {token_to_remove} at position {res_dict['start']}-{res_dict['end']}")
                continue
            
            filtered_results.append(
                RecognizerResult(
                    entity_type=res_dict["entity_type"],
                    start=res_dict["start"],
                    end=res_dict["end"],
                    score=res_dict["score"],
                )
            )
        
        logger.info(f"Filtered results: removed token {token_to_remove}, {len(filtered_results)} results remaining.")
        return filtered_results

    def anonymize_text(self, text: str, analyzer_results: List[RecognizerResult]) -> Tuple[str, Dict[str, Dict], List[Dict]]:
        """
        Anonymizes the given text by replacing detected PII with unique, consistent tokens.
        """
        if not analyzer_results:
            return text, {}, []

        # --- Defensive data conversion ---
        # Ensure analyzer_results are RecognizerResult objects, not dicts.
        if analyzer_results and isinstance(analyzer_results[0], dict):
            logger.warning("anonymize_text received a list of dicts, converting to RecognizerResult objects.")
            analyzer_results = [
                RecognizerResult(
                    entity_type=res["entity_type"],
                    start=res["start"],
                    end=res["end"],
                    score=res["score"],
                )
                for res in analyzer_results
            ]

        consistency_map = {}
        entity_counters = defaultdict(int)
        
        sorted_results = sorted(analyzer_results, key=lambda x: x.start)

        for result in sorted_results:
            original_pii = text[result.start:result.end]
            if original_pii not in consistency_map:
                entity_type = result.entity_type
                entity_counters[entity_type] += 1
                token = f"[{entity_type}_{entity_counters[entity_type]}]"
                consistency_map[original_pii] = {
                    "token": token,
                    "entity_type": entity_type,
                    "score": result.score,
                }

        output_parts = []
        last_end = 0
        for result in sorted_results:
            output_parts.append(text[last_end:result.start])
            original_pii = text[result.start:result.end]
            output_parts.append(consistency_map[original_pii]["token"])
            last_end = result.end
        
        output_parts.append(text[last_end:])
        anonymized_text = "".join(output_parts)

        token_mapping = {
            details["token"]: {
                "original_value": original_pii,
                "entity_type": details["entity_type"],
                "score": details["score"],
            }
            for original_pii, details in consistency_map.items()
        }

        tokens_info = [
            {
                "token": consistency_map[text[res.start:res.end]]["token"],
                "original_value": text[res.start:res.end], # <--- Add this
                "entity_type": res.entity_type,
                "start": res.start,
                "end": res.end,
                "score": res.score,
            }
            for res in sorted_results
        ]

        logger.info(f"anonymize_text: tokens_info constructed: {tokens_info}") # <--- Add this line

        return anonymized_text, token_mapping, tokens_info

    def integrate_manual_token(
        self,
        original_text: str,
        existing_results: List[Dict],
        manual_token_info: Dict
    ) -> Tuple[List[RecognizerResult], int]:
        """
        Integrates a manually provided token into the list of existing RecognizerResults.
        Finds all exact, case-sensitive occurrences of the selected text and tokenizes them,
        but ONLY if they don't overlap with existing tokens (automatic or manual).
        
        Returns:
            Tuple[List[RecognizerResult], int]: A tuple of (final_results, additional_occurrences_count)
        """
        text_to_tokenize = manual_token_info["text_to_tokenize"]
        entity_type = manual_token_info["entity_type"]
        manual_start = manual_token_info["start"]
        manual_end = manual_token_info["end"]
        
        # Convert existing_results (List[Dict]) to List[RecognizerResult]
        converted_existing_results = []
        for res_dict in existing_results:
            converted_existing_results.append(
                RecognizerResult(
                    entity_type=res_dict["entity_type"],
                    start=res_dict["start"],
                    end=res_dict["end"],
                    score=res_dict["score"],
                )
            )
        
        # Check if the user's selected text overlaps with any existing token
        for existing_result in converted_existing_results:
            # Check for any overlap: two ranges overlap if start1 < end2 AND start2 < end1
            if manual_start < existing_result.end and existing_result.start < manual_end:
                logger.warning(
                    f"Cannot manually tokenize: selected text ({manual_start}-{manual_end}) "
                    f"overlaps with existing {existing_result.entity_type} token ({existing_result.start}-{existing_result.end})"
                )
                raise ValueError(
                    f"Cannot tokenize text that overlaps with an existing token. "
                    f"The selected text overlaps with an existing {existing_result.entity_type} token. "
                    f"Please revert the existing token first if you want to change it."
                )
        
        # Find all exact, case-sensitive occurrences of the text
        manual_results = []
        search_start = 0
        
        while True:
            index = original_text.find(text_to_tokenize, search_start)
            if index == -1:
                break
            
            # Verify it's a complete match (not part of a larger word)
            # Check if preceded by word boundary
            if index > 0 and original_text[index - 1].isalnum():
                search_start = index + 1
                continue
            
            # Check if followed by word boundary
            end_index = index + len(text_to_tokenize)
            if end_index < len(original_text) and original_text[end_index].isalnum():
                search_start = index + 1
                continue
            
            # Check if this occurrence overlaps with any existing token
            overlaps_with_existing = False
            for existing_result in converted_existing_results:
                if index < existing_result.end and existing_result.start < end_index:
                    overlaps_with_existing = True
                    logger.debug(
                        f"Skipping occurrence at {index}-{end_index}: overlaps with existing "
                        f"{existing_result.entity_type} token at {existing_result.start}-{existing_result.end}"
                    )
                    break
            
            if not overlaps_with_existing:
                # Create a RecognizerResult for this occurrence
                manual_results.append(
                    RecognizerResult(
                        entity_type=entity_type,
                        start=index,
                        end=end_index,
                        score=1.0,  # Assign highest score
                        analysis_explanation="Manually added token"
                    )
                )
            
            search_start = end_index
        
        # Calculate additional occurrences (total found minus the original selection)
        additional_occurrences = max(0, len(manual_results) - 1)
        
        logger.info(
            f"Found {len(manual_results)} total non-overlapping occurrences of '{text_to_tokenize}' "
            f"({additional_occurrences} additional)"
        )

        # Combine existing and manual results
        combined_results = converted_existing_results + manual_results

        # Sort by start position for consistency
        combined_results.sort(key=lambda x: x.start)

        return combined_results, additional_occurrences
