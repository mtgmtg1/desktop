class TrainLoopManager {
    private static instance: TrainLoopManager;

    private constructor() {}

    public static getInstance(): TrainLoopManager {
        if (!TrainLoopManager.instance) {
            TrainLoopManager.instance = new TrainLoopManager();
        }
        return TrainLoopManager.instance;
    }

    public async saveApplyResult(_messages: unknown[], _type: string): Promise<void> {
        return;
    }
}

export default TrainLoopManager.getInstance();
