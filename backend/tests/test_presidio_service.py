import pytest
from app.services.presidio_service import PresidioService
from presidio_analyzer import RecognizerResult

@pytest.fixture
def presidio_service():
    # Fixture for the original, simple service for basic tests
    return PresidioService(supported_entities=["PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER"])

@pytest.fixture
def advanced_presidio_service():
    # A more advanced fixture that includes all the entities we need for the new test
    return PresidioService(supported_entities=[
        "PERSON", "DATE_TIME", "LOCATION", "EMAIL_ADDRESS", 
        "US_SSN", "US_BANK_ACCOUNT_NUMBER"
    ])

def test_analyze_text_no_pii(presidio_service):
    text = "This is a sample text with no PII."
    results = presidio_service.analyze_text(text)
    assert len(results) == 0

def test_analyze_text_with_pii(presidio_service):
    text = "My name is John Doe and my email is john.doe@example.com."
    results = presidio_service.analyze_text(text)
    assert len(results) >= 2
    assert any(r.entity_type == "PERSON" for r in results)
    assert any(r.entity_type == "EMAIL_ADDRESS" for r in results)

def test_analyze_text_specific_entities(presidio_service):
    text = "My name is John Doe and my email is john.doe@example.com."
    results = presidio_service.analyze_text(text, entities=["PERSON"])
    assert len(results) >= 1
    assert results[0].entity_type == "PERSON"

def test_anonymize_text_no_pii(presidio_service):
    text = "This is a sample text with no PII."
    analyzer_results = []
    anonymized_text, token_map, _ = presidio_service.anonymize_text(text, analyzer_results)
    assert anonymized_text == text
    assert token_map == {}

# Note: This test is now modified to reflect the new consistent anonymization logic
def test_anonymize_text_with_pii(presidio_service):
    text = "My name is John Doe and my email is john.doe@example.com."
    analyzer_results = presidio_service.analyze_text(text)
    anonymized_text, token_map, _ = presidio_service.anonymize_text(text, analyzer_results)
    assert anonymized_text == "My name is [PERSON_1] and my email is [EMAIL_ADDRESS_1]."
    assert "[PERSON_1]" in token_map
    assert "[EMAIL_ADDRESS_1]" in token_map
    assert token_map["[PERSON_1]"]["original_value"] == "John Doe"
    assert token_map["[EMAIL_ADDRESS_1]"]["original_value"] == "john.doe@example.com"


# --- Phase 5.1: New Test for Advanced PII Detection and Conflict Resolution ---

def test_advanced_pii_detection_and_anonymization(advanced_presidio_service):
    """
    Tests the service with a complex document containing overlapping entities,
    custom patterns (SSN, Bank Account), and repeated PII to verify all Phase 4 fixes.
    """
    input_text = (
        "John Smith, born on 04/15/1985, lives at 742 Evergreen Terrace, Springfield. "
        "He recently updated his email to john.smith@example.com and his Social Security Number is 123-45-6789. "
        "During his last bank visit, his account number 987654321 was verified. "
        "Once again, the clients name is John Smith."
    )

    # 1. Analyze the text
    analyzer_results = advanced_presidio_service.analyze_text(input_text)

    # 2. Anonymize the text
    sanitized_text, token_map, tokens_info = advanced_presidio_service.anonymize_text(input_text, analyzer_results)

    # 3. Verify consistent anonymization for "John Smith"
    assert sanitized_text.count("[PERSON_1]") == 2
    assert sanitized_text.count("[PERSON_2]") == 0
    assert token_map["[PERSON_1]"]["original_value"] == "John Smith"

    # 4. Verify correct detection of custom patterns (SSN and Bank Account)
    # Find the tokens by looking up the original text in the tokens_info list
    ssn_token_info = next((t for t in tokens_info if input_text[t['start']:t['end']] == "123-45-6789"), None)
    bank_acct_token_info = next((t for t in tokens_info if input_text[t['start']:t['end']] == "987654321"), None)

    assert ssn_token_info is not None, "SSN was not detected"
    assert ssn_token_info['entity_type'] == "US_SSN"
    assert ssn_token_info['token'] in token_map
    assert token_map[ssn_token_info['token']]["original_value"] == "123-45-6789"

    assert bank_acct_token_info is not None, "Bank Account Number was not detected"
    assert bank_acct_token_info['entity_type'] == "US_BANK_ACCOUNT_NUMBER"
    assert bank_acct_token_info['token'] in token_map
    assert token_map[bank_acct_token_info['token']]["original_value"] == "987654321"

    # 5. Verify conflict resolution (no mashed-up tokens for email)
    assert "[URL_1]" not in sanitized_text
    assert "[EMAIL_ADDRESS_1]" in sanitized_text
    email_token_info = next((t for t in tokens_info if t['entity_type'] == "EMAIL_ADDRESS"), None)
    assert email_token_info is not None, "Email address was not detected"
    assert token_map[email_token_info['token']]["original_value"] == "john.smith@example.com"

    # 6. Verify the final sanitized string structure
    expected_sanitized_text = (
        "[PERSON_1], born on [DATE_TIME_1], lives at 742 Evergreen Terrace, [LOCATION_1]. "
        "He recently updated his email to [EMAIL_ADDRESS_1] and his Social Security Number is [US_SSN_1]. "
        "During his last bank visit, his account number [US_BANK_ACCOUNT_NUMBER_1] was verified. "
        "Once again, the clients name is [PERSON_1]."
    )
    assert sanitized_text == expected_sanitized_text