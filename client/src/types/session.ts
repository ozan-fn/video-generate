export interface SessionItem {
    id: string;
    status: "processing" | "completed" | "failed" | "pending";
}

export interface SessionsState {
    sessionList: {
        id: string;
        status: "valid" | "invalid" | "pending";
    }[];
    sessions: SessionItem[];
}
