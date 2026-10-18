import asyncio
import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.knowledge_base import get_relevant_knowledge

logger = logging.getLogger(__name__)

# Official 6 assignment categories
VALID_CATEGORIES = [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry",
]

VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"]


class ClassificationResult(BaseModel):
    category: str
    priority: str
    reasoning: str
    source: str  # "ai" | "fallback"


class DraftResponseResult(BaseModel):
    draft_reply: str
    grounding_facts: List[str]
    policy_references: List[str]
    confidence: float
    model_used: str


class AIServiceInterface(ABC):
    @abstractmethod
    async def classify_and_prioritize(
        self,
        subject: str,
        description: str,
        book_info: Optional[Dict[str, Any]] = None,
    ) -> ClassificationResult:
        pass

    @abstractmethod
    async def generate_draft_response(
        self,
        author_name: str,
        ticket_subject: str,
        ticket_description: str,
        category: str,
        priority: str,
        book_info: Optional[Dict[str, Any]] = None,
        custom_instructions: Optional[str] = None,
    ) -> DraftResponseResult:
        pass


class DeterministicFallbackAIService(AIServiceInterface):
    """Robust rule-based heuristic classifier and response generator for offline / fallback mode."""

    async def classify_and_prioritize(
        self,
        subject: str,
        description: str,
        book_info: Optional[Dict[str, Any]] = None,
    ) -> ClassificationResult:
        text = f"{subject} {description}".lower()

        # 1. Royalty & Payments
        if any(w in text for w in ["royalty", "payment", "bank", "payout", "unpaid", "money", "earn", "account"]):
            category = "Royalty & Payments"
            if any(w in text for w in ["6 months", "overdue", "never received", "missing payment", "not received"]):
                priority = "Critical"
                reasoning = "Author reports severely overdue or missing royalties (exceeding quarterly threshold)."
            elif any(w in text for w in ["incorrect", "discrepancy", "low royalty", "wrong amount"]):
                priority = "High"
                reasoning = "Author queries royalty calculation or reports potential discrepancy."
            else:
                priority = "Medium"
                reasoning = "General royalty inquiry or payout schedule question."
            return ClassificationResult(
                category=category,
                priority=priority,
                reasoning=reasoning,
                source="fallback",
            )

        # 2. ISBN & Metadata
        if any(w in text for w in ["isbn", "barcode", "imprint", "wrong book", "metadata", "edition"]):
            category = "ISBN & Metadata Issues"
            if any(w in text for w in ["different isbn", "wrong isbn", "duplicate", "mismatch"]):
                priority = "High"
                reasoning = "High-priority ISBN mismatch or metadata collision reported."
            else:
                priority = "Medium"
                reasoning = "Metadata update or imprint inquiry."
            return ClassificationResult(
                category=category,
                priority=priority,
                reasoning=reasoning,
                source="fallback",
            )

        # 3. Printing & Quality
        if any(w in text for w in ["print", "blurry", "binding", "page", "misprint", "damage", "paper quality", "defect"]):
            category = "Printing & Quality"
            if any(w in text for w in ["unusable", "terrible", "completely misaligned", "bulk defective"]):
                priority = "High"
                reasoning = "Severe physical print quality defect reported requiring urgent reprint assessment."
            else:
                priority = "Medium"
                reasoning = "Author received printed copies with reported quality concerns."
            return ClassificationResult(
                category=category,
                priority=priority,
                reasoning=reasoning,
                source="fallback",
            )

        # 4. Distribution & Availability
        if any(w in text for w in ["amazon", "flipkart", "out of stock", "unavailable", "listing", "store", "distribution"]):
            category = "Distribution & Availability"
            priority = "Medium"
            reasoning = "Distribution channel listing or stock availability synchronization issue."
            return ClassificationResult(
                category=category,
                priority=priority,
                reasoning=reasoning,
                source="fallback",
            )

        # 5. Book Status & Production Updates
        if any(w in text for w in ["typeset", "cover design", "proofread", "production", "status", "stage", "when will", "delay"]):
            category = "Book Status & Production Updates"
            if any(w in text for w in ["weeks delayed", "stuck", "months"]):
                priority = "High"
                reasoning = "Production pipeline delay flagged by author."
            else:
                priority = "Medium"
                reasoning = "Inquiry regarding the active production or editorial milestone."
            return ClassificationResult(
                category=category,
                priority=priority,
                reasoning=reasoning,
                source="fallback",
            )

        # 6. General Inquiry
        return ClassificationResult(
            category="General Inquiry",
            priority="Low",
            reasoning="General question or administrative request.",
            source="fallback",
        )

    async def generate_draft_response(
        self,
        author_name: str,
        ticket_subject: str,
        ticket_description: str,
        category: str,
        priority: str,
        book_info: Optional[Dict[str, Any]] = None,
        custom_instructions: Optional[str] = None,
    ) -> DraftResponseResult:
        first_name = author_name.split()[0] if author_name else "Author"
        grounding_facts = []
        policy_refs = []

        book_title = book_info.get("title") if book_info else "your publication"
        if book_info:
            grounding_facts.append(f"Book: {book_title} (ID: {book_info.get('book_id', 'N/A')})")
            grounding_facts.append(f"Status: {book_info.get('status', 'N/A')}")
            grounding_facts.append(f"Copies Sold: {book_info.get('total_copies_sold', 0)}")
            grounding_facts.append(f"Royalty Paid: ₹{book_info.get('royalty_paid', 0)}")
            grounding_facts.append(f"Royalty Pending: ₹{book_info.get('royalty_pending', 0)}")
            if book_info.get("last_royalty_payout_date"):
                grounding_facts.append(f"Last Payout: {book_info.get('last_royalty_payout_date')}")

        if category == "Royalty & Payments":
            policy_refs.append("Royalty Policy: 80/20 Net Profit split; Quarterly payout within 45 days; ₹1,000 threshold.")
            body = (
                f"Thank you for contacting BookLeaf Support regarding your royalties for '{book_title}'.\n\n"
                f"I completely understand your concern and appreciate your patience while we review your account. "
                f"As per our official royalty policy, royalties are calculated on an 80/20 net-profit split "
                f"(MRP minus printing costs, channel commissions, and shipping) and disbursed quarterly within 45 days "
                f"of the quarter end for balances meeting the ₹1,000 threshold.\n\n"
            )
            if book_info:
                pending = book_info.get("royalty_pending", 0)
                paid = book_info.get("royalty_paid", 0)
                body += (
                    f"According to our verified database records:\n"
                    f"• Total Copies Sold to Date: {book_info.get('total_copies_sold', 0)}\n"
                    f"• Royalties Disbursed: ₹{paid:,.2f}\n"
                    f"• Current Pending Royalties: ₹{pending:,.2f}\n\n"
                )
            body += (
                "Our finance operations team has flagged your account for review to ensure bank transfer details "
                "are properly reconciled. We will verify your payout status and update you directly within 48 hours."
            )

        elif category == "ISBN & Metadata Issues":
            policy_refs.append("ISBN Policy: Unique imprint registration; Immediate 48-hour production escalation.")
            body = (
                f"Thank you for bringing this to our attention, {first_name}.\n\n"
                f"We treat ISBN and metadata accuracy with the highest priority. Every title published through "
                f"BookLeaf is assigned a dedicated ISBN registered under our official publisher imprint.\n\n"
                f"I have immediately escalated this ticket to our senior production and data team for verification. "
                f"We will audit the catalog feeds across distribution platforms to resolve any mismatch. "
                f"You will receive an update from our production leads within 48 hours."
            )

        elif category == "Printing & Quality":
            policy_refs.append("Printing Policy: 5-7 business days turnaround; Free reprint on verified defect.")
            body = (
                f"Dear {first_name},\n\n"
                f"We are very sorry to hear about the print quality issues with '{book_title}'. "
                f"BookLeaf holds strict quality standards, and we sincerely apologize for any inconvenience caused.\n\n"
                f"Under our quality guarantee, any verified physical defect qualifies for a complimentary reprint. "
                f"Could you please share clear photographs showing the misaligned pages, binding, or cover issues? "
                f"Once verified by our printing team, we will dispatch a replacement copy within 5–7 business days."
            )

        elif category == "Distribution & Availability":
            policy_refs.append("Distribution Policy: 7-10 days for new listings; 24-48 hour stock re-sync.")
            body = (
                f"Hello {first_name},\n\n"
                f"Thank you for reaching out regarding the availability of '{book_title}'.\n\n"
                f"Temporary 'Unavailable' or out-of-stock notices on platforms like Amazon or Flipkart typically occur "
                f"during automated inventory synchronization rounds. Our operations team has initiated a catalog re-sync "
                f"with our distribution partner. The listing should reflect correct availability within 24–48 hours."
            )

        elif category == "Book Status & Production Updates":
            policy_refs.append("Production Pipeline: 9 sequential stages; Honest status reporting.")
            curr_status = book_info.get("status", "In Production") if book_info else "In Production"
            body = (
                f"Hello {first_name},\n\n"
                f"Thank you for checking in on the progress of '{book_title}'.\n\n"
                f"Your book is currently in the '{curr_status}' phase. Our editorial and production specialists are "
                f"actively advancing your files to the next milestone. Delays at this stage typically allow for meticulous "
                f"quality checks and revision proofs.\n\n"
                f"We will notify you via email as soon as the typesetting and proofing files are ready for your review."
            )

        else:
            policy_refs.append("Company Overview: Empathetic partner support.")
            body = (
                f"Hello {first_name},\n\n"
                f"Thank you for reaching out to BookLeaf Author Support.\n\n"
                f"We have received your query regarding '{ticket_subject}'. Our author success team is looking into "
                f"the details of your request and will follow up with complete information within 24 to 48 hours.\n\n"
                f"Please let us know if you have any additional questions in the meantime."
            )

        closing = "\n\nWarm regards,\nBookLeaf Author Support Team"
        full_draft = f"Dear {first_name},\n\n{body}{closing}"

        return DraftResponseResult(
            draft_reply=full_draft,
            grounding_facts=grounding_facts,
            policy_references=policy_refs,
            confidence=0.92,
            model_used="deterministic-fallback-rules",
        )


class GeminiAIService(AIServiceInterface):
    """Production AI Service using official Google Gen AI SDK with strict schema constraints and fallback."""

    def __init__(self):
        self.fallback_service = DeterministicFallbackAIService()
        self.client = None
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize Google Gen AI client: {e}. Will use fallback.")

    async def classify_and_prioritize(
        self,
        subject: str,
        description: str,
        book_info: Optional[Dict[str, Any]] = None,
    ) -> ClassificationResult:
        if not self.client or not settings.GEMINI_API_KEY:
            logger.info("No Gemini API key configured. Executing deterministic fallback classifier.")
            return await self.fallback_service.classify_and_prioritize(subject, description, book_info)

        prompt = f"""You are the automated classification engine for BookLeaf Publishing Author Support.
Analyze the following author support ticket and classify it into EXACTLY ONE category and ONE priority score.

ALLOWED CATEGORIES:
1. Royalty & Payments
2. ISBN & Metadata Issues
3. Printing & Quality
4. Distribution & Availability
5. Book Status & Production Updates
6. General Inquiry

ALLOWED PRIORITIES:
- Critical (e.g. royalties unpaid > 6 months, severe blocking legal/financial issues)
- High (e.g. ISBN mismatch on live stores, duplicate ISBN, verified defective bulk author copies)
- Medium (e.g. standard distribution sync issue, production milestone update, general royalty explanation)
- Low (e.g. author bio update, general curiosity, routine questions)

TICKET CONTEXT:
Subject: {subject}
Description: {description}
Book Context: {json.dumps(book_info) if book_info else 'General / Account Level'}

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this schema:
{{
  "category": "one of the 6 allowed categories",
  "priority": "Critical | High | Medium | Low",
  "reasoning": "brief 1-2 sentence justification"
}}
"""
        try:
            from google.genai import types

            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.client.models.generate_content,
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        response_mime_type="application/json",
                    ),
                ),
                timeout=settings.AI_TIMEOUT_SECONDS,
            )

            response_text = response.text.strip()
            data = json.loads(response_text)

            cat = data.get("category", "").strip()
            if cat not in VALID_CATEGORIES:
                # Find closest match
                for valid_c in VALID_CATEGORIES:
                    if valid_c.lower() in cat.lower():
                        cat = valid_c
                        break
                else:
                    cat = "General Inquiry"

            prio = data.get("priority", "").strip()
            if prio not in VALID_PRIORITIES:
                prio = "Medium"

            return ClassificationResult(
                category=cat,
                priority=prio,
                reasoning=data.get("reasoning", "AI classified ticket content."),
                source="ai",
            )

        except Exception as e:
            logger.warning(f"Gemini classification failed or timed out: {e}. Falling back to deterministic engine.")
            fallback_res = await self.fallback_service.classify_and_prioritize(subject, description, book_info)
            fallback_res.reasoning = f"(AI fallback triggered: {str(e)[:60]}...) {fallback_res.reasoning}"
            return fallback_res

    async def generate_draft_response(
        self,
        author_name: str,
        ticket_subject: str,
        ticket_description: str,
        category: str,
        priority: str,
        book_info: Optional[Dict[str, Any]] = None,
        custom_instructions: Optional[str] = None,
    ) -> DraftResponseResult:
        if not self.client or not settings.GEMINI_API_KEY:
            logger.info("No Gemini API key configured. Generating fallback draft response.")
            return await self.fallback_service.generate_draft_response(
                author_name, ticket_subject, ticket_description, category, priority, book_info, custom_instructions
            )

        kb_snippets = get_relevant_knowledge(category, ticket_description)
        kb_text = "\n\n".join(kb_snippets)

        prompt = f"""You are a senior Author Support Specialist at BookLeaf Publishing.
Draft an empathetic, professional, and concrete support response for an author.

GUIDELINES & TONE:
- Authors are partners, not customers to manage.
- Acknowledge their concern first before jumping into policies.
- Cite specific verified facts from the author's database records below. Do NOT invent dates, numbers, or refunds.
- Ground your answer strictly in the provided BookLeaf Knowledge Base policies.
- If something is BookLeaf's error, own it directly without corporate deflection.
- Always conclude with a clear next step and a realistic resolution timeline (e.g. "within 48 hours" or "5–7 business days").
- Never promise an action that has not actually occurred.

OFFICIAL KNOWLEDGE BASE SNIPPETS:
{kb_text}

VERIFIED DATABASE FACTS:
Author Name: {author_name}
Book Context: {json.dumps(book_info) if book_info else 'General Account / No specific book'}

AUTHOR'S SUBMITTED QUERY:
Subject: {ticket_subject}
Description: {ticket_description}
Category: {category}
Priority: {priority}
{f'Custom Admin Instructions: {custom_instructions}' if custom_instructions else ''}

OUTPUT FORMAT:
Respond with a JSON object:
{{
  "draft_reply": "the full, beautifully worded response ready for admin review",
  "grounding_facts": ["fact 1 from database", "fact 2 from database"],
  "policy_references": ["name of policy applied", "timeline applied"]
}}
"""
        try:
            from google.genai import types

            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.client.models.generate_content,
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        response_mime_type="application/json",
                    ),
                ),
                timeout=settings.AI_TIMEOUT_SECONDS,
            )

            data = json.loads(response.text.strip())
            return DraftResponseResult(
                draft_reply=data.get("draft_reply", ""),
                grounding_facts=data.get("grounding_facts", []),
                policy_references=data.get("policy_references", []),
                confidence=0.96,
                model_used=settings.GEMINI_MODEL,
            )

        except Exception as e:
            logger.warning(f"Gemini draft generation failed: {e}. Falling back to deterministic draft engine.")
            return await self.fallback_service.generate_draft_response(
                author_name, ticket_subject, ticket_description, category, priority, book_info, custom_instructions
            )


# Global AI Service instance
ai_service = GeminiAIService()
