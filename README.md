# PlaceMate AI – Placement Preparation Chatbot

An intelligent, unified AI Placement Coach designed for college students preparing for campus recruitment, technical interviews, coding rounds, and aptitude exams.

---

## Key Features

- **One Unified Chat Interface**: Ask **ANY** placement-related question in natural language. No forced categories, no rigid tabs, and no predefined question limitations.
- **Natural-Language Understanding & Automatic Intent Detection**: Understands queries across Quantitative Aptitude, Logical Reasoning, Coding & DSA, Core CS (DBMS, OOP, OS, Computer Networks), AI/ML, System Design, Resumes, Mock Interviews, Company Prep, and Study Plans.
- **Step-by-Step Verified Aptitude Solver**:
  - Automatically identifies the topic
  - Selects the correct formula
  - Shows line-by-line working
  - Provides a verified final answer with units
  - Gives practical shortcuts and speed tips
- **Coding & DSA Assistance**:
  - Supports Python, Java, C++, and more
  - Explains concepts and algorithms clearly
  - Debugs student code with clear explanation of root causes
  - Provides guided hints upon request before revealing full solutions
  - States Time and Space Complexity (Big-O) for every DSA problem
- **Interactive Scored Mock Interviews**:
  - Conducts 1-on-1 interviews asking **one question at a time**
  - Evaluates student answers with a rubric score out of 10 (`Score: X/10`)
  - Identifies Strengths and actionable Weaknesses
  - Provides model answers and contextual follow-up questions
  - Supports HR, Technical, Python, SQL, AI/ML, DSA, and Project-based rounds
- **Company-Specific Guidance**:
  - Realistic preparation roadmaps for TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, Amazon, etc.
  - Covers aptitude patterns, technical rounds, coding expectations, and HR strategy
- **Resume & Project Review**:
  - Actionable feedback on resume bullets (Action Verb + Task + Quantifiable Impact)
  - Project defense using the STAR framework
  - Zero hallucination (uses only user-provided resume text)
- **Multi-Turn Contextual Memory**:
  - Remembers previous turns (e.g. *"I want to prepare for Python"* → *"Give me questions"* → *"Make them difficult"*)
- **Polite Off-Topic Redirection**:
  - Keeps students focused on placement preparation while warmly addressing any indirectly relevant technical topics
- **Secure Gemini API Integration**:
  - Server-side proxy middleware protects API keys from being exposed in client bundles
  - Reads `GEMINI_API_KEY` securely from `.env` or system environment variables
  - Resilient model fallback and automatic offline solver fallback if network or rate limits occur

---

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install and Run

```bash
npm install
npm run dev
```

Open your browser at `http://localhost:5173` (or the URL Vite prints in the terminal).

### 3. Production Build

```bash
npm run build
npm run preview
```

---

## Example Prompts to Try

1. **Aptitude**: *"A train travels 360 km in 4 hours. What is its speed?"*
2. **Mental Math**: *"Solve 20% of 450."*
3. **Coding**: *"Give me a Python coding question with examples and hints."*
4. **Data Structures**: *"Teach me arrays and explain time complexity."*
5. **Debugging**: *"Why am I getting IndexError: list index out of range in Python?"*
6. **Mock Interview**: *"Start a mock interview for HR."*
7. **Core CS**: *"What is DBMS normalization? Explain 1NF, 2NF, and 3NF."*
8. **AI/ML**: *"What is supervised learning vs unsupervised learning?"*
9. **Project Defense**: *"How should I explain my final year project to an interviewer?"*
10. **Study Planning**: *"I have 15 days for placement preparation. Give me a plan."*
11. **Company Preparation**: *"How do I prepare for TCS campus recruitment?"*
12. **Career Strategy**: *"How do I answer 'Tell me about yourself' in an HR round?"*
