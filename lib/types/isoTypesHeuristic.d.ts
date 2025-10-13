export type HeuristicScores = {
    layout: number;
    typography: number;
    color: number;
    accessibility: number;
    usability: number;
};

export type IsoMapping = {
    suitability: number;
    selfDescriptiveness: number;
    conformity: number;
    errorTolerance: number;
    learning: number;
    individualization: number;
};