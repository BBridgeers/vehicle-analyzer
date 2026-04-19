# ADR 001: Vision Model Transition for Vehicle Analyzer Pro

## Status
Proposed (Pending User Approval)

## Context
The application currently relies on Gemini Vision for vehicle listing analysis. The user has depleted Gemini credits and requires a cost-effective or local alternative.
Hardware Detection:
- GPU: NVIDIA GeForce MX230 (2GB VRAM)
- RAM: 16GB
- OS: Windows

## Decision
We will transition to a **Dual-Provider Vision Pipeline**:
1. **Primary Provider:** Groq (Llama 3.2 Vision 11B/90B). 
   - **Rationale:** Highest performance ("Strongest"), zero/low cost, and extreme speed (essential for agentic behavior).
2. **Fallback Provider:** Local Ollama (Llama 3.2 Vision 11B Q4_K_M).
   - **Rationale:** Provides local privacy and reliability if the cloud is unavailable, albeit at much slower speeds on CPU RAM.

## Technical Strategy (Angle of Attack)
- **Model-Agnostic Interface:** Refactor `fb_subagent.ts` to use a generic `IVisionEngine` interface.
- **Robust JSON Extraction:**
  - Implement a `RobustExtractor` class.
  - Use `json_object` mode on Groq.
  - Use strict schema validation (Zod-like) to ensure the "Lemon Detection" logic remains intact.
  - Implement a "Self-Correction" loop if the LLM output is malformed.

## Consequences
- **Positive:** Significant cost reduction, improved response latency (on Groq), and local redundancy.
- **Negative:** Increased code complexity for provider management; local execution will be significantly slower than Gemini.
- **Neutral:** Need to manage `GROQ_API_KEY` in environment variables.
