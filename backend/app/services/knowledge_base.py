from typing import List, Dict

BOOKLEAF_KNOWLEDGE_BASE: Dict[str, str] = {
    "COMPANY_OVERVIEW": """Company Overview:
BookLeaf Publishing is a self-publishing company operating in India and the US.
We offer publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
We handle cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.
Our in-house printing facility and warehouse are located in Delhi. We also work with print partners including Repro India and Epitome Books.""",

    "ROYALTY_POLICY": """Royalty Policy:
• BookLeaf follows an 80/20 royalty split: 80% of net profit per book goes to author, 20% to BookLeaf.
• Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
• Royalties are calculated quarterly and paid within 45 days of the quarter ending.
• Minimum payout threshold: ₹1,000. If accumulated royalties are below ₹1,000, they roll over to the next quarter.
• Payouts are made via bank transfer to the account linked in the author's dashboard.
• Authors can view detailed royalty breakdown showing sales figures per platform.""",

    "ISBN_POLICY": """ISBN Policy:
• Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf registered under BookLeaf's publisher imprint.
• If an author wants an ISBN under their own imprint, they need to obtain it independently.
• If an author reports an ISBN error (duplicate, wrong book linked), it is treated as a high-priority issue and escalated immediately to the production team with a 48-hour resolution timeline.""",

    "PRINTING_QUALITY": """Printing & Quality Policy:
• In-house printing handles most orders; overflow or specific format requirements go to Repro India or Epitome Books.
• Standard print turnaround: 5–7 business days from order confirmation.
• If an author reports a quality issue (misprints, binding defects, color inconsistency), BookLeaf arranges a free reprint after verification. The author may need to share photos of the defective copy. Reprint timeline: 5–7 business days.""",

    "DISTRIBUTION_AVAILABILITY": """Distribution & Availability Policy:
• Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
• New listings typically go live within 7–10 business days after publication is complete.
• If a book shows as "Currently Unavailable", it usually indicates a stock sync issue—BookLeaf's team can trigger a re-sync with the distribution team within 24–48 hours to restore availability.""",

    "PRODUCTION_STAGES": """Production Pipeline & Stages:
• Complete pipeline: Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
• Authors are updated at each stage via email. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds). Communicate actual book status honestly.""",

    "COMMUNICATION_TONE": """Communication Tone Guidelines:
• Always empathetic and professional. Authors are partners, not customers to be managed.
• Acknowledge the author's concern before jumping to solutions.
• Be specific: include actual numbers, dates, and verified database statuses wherever possible rather than vague reassurances.
• If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly with no corporate deflection.
• If the issue requires escalation or investigation, give a clear timeline ("Our team will look into this and get back to you within 48 hours").
• Always end with a clear next step for the author and/or the BookLeaf team."""
}


def get_relevant_knowledge(category: str, query_text: str = "") -> List[str]:
    """Retrieve only the relevant knowledge base snippets based on category and query content."""
    snippets = [BOOKLEAF_KNOWLEDGE_BASE["COMMUNICATION_TONE"]]
    cat_lower = category.lower()
    text_lower = query_text.lower()

    if "royalty" in cat_lower or "payment" in cat_lower or "royalt" in text_lower or "payout" in text_lower:
        snippets.append(BOOKLEAF_KNOWLEDGE_BASE["ROYALTY_POLICY"])

    if "isbn" in cat_lower or "metadata" in cat_lower or "isbn" in text_lower:
        snippets.append(BOOKLEAF_KNOWLEDGE_BASE["ISBN_POLICY"])

    if "print" in cat_lower or "quality" in cat_lower or "misprint" in text_lower or "defect" in text_lower:
        snippets.append(BOOKLEAF_KNOWLEDGE_BASE["PRINTING_QUALITY"])

    if "distribut" in cat_lower or "availab" in cat_lower or "amazon" in text_lower or "flipkart" in text_lower:
        snippets.append(BOOKLEAF_KNOWLEDGE_BASE["DISTRIBUTION_AVAILABILITY"])

    if "status" in cat_lower or "production" in cat_lower or "typeset" in text_lower or "cover" in text_lower:
        snippets.append(BOOKLEAF_KNOWLEDGE_BASE["PRODUCTION_STAGES"])

    if len(snippets) == 1:  # General Inquiry
        snippets.append(BOOKLEAF_KNOWLEDGE_BASE["COMPANY_OVERVIEW"])

    return snippets
