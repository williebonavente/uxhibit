
export type LayoutIssue = {
    id: string;
    severity: "low" | "medium" | "high";
    message: string;
    suggestion: string;
    details?: LayoutIssueDetails;
    confidence: number;
    overrideable?: boolean;
    wcagReference: string | undefined;
};

export interface LayoutIssue {
    id: string;
    severity: "low" | "medium" | "high";
    message: string;
    suggestion: string;
    wcagReference?: string;
    overrideable?: boolean;
    details?: LayoutIssueDetails;
}

export interface LayoutIssueDetails {
    min?: number;
    max?: number;
    delta?: number;
    nodes?: string[];
}

export type LayoutCheckResult = {
    score: number;
    issues: LayoutIssue[];
    summary: string;
};