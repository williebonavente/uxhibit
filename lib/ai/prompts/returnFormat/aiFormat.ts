export const critiqueReturnFormat = `
Return ONLY valid JSON in the following format:
{
  "overall_score": number (0-100),
  "summary": string, 
  "strengths": string[],
  "weaknesses": string[],
  "issues": [
    { 
      "id": string, 
      "heuristic": string (e.g. "01" for Visibility of System Status, "02" for Match Between System and the Real World, ... "10" for Help and Documentation),
      "severity": "low|medium|high", 
      "message": string, // This must clearly explain why the heuristic is violated in this UI/frame 
      "suggestion": string 
    }
  ],
  "category_scores": {
    "accessibility": number,
    "typography": number,
    "color": number,
    "layout": number,
    "hierarchy": number,
    "usability": number
  },
  "resources": [
    {
      "issue_id": string, // must match the id of the weakness/issue
      "title": string,
      "url": string,
      "description": string
    }
  ]    
}
`;