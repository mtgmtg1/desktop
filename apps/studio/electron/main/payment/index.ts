export const checkoutWithStripe = async (): Promise<{
    success: boolean;
    error?: string;
}> => {
    return { success: false, error: 'Payments disabled in local mode' };
};

export const checkSubscription = async (): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> => {
    return { success: true, data: { plan: 'pro' } };
};

export const manageSubscription = async (): Promise<{
    success: boolean;
    error?: string;
}> => {
    return { success: false, error: 'Payments disabled in local mode' };
};
