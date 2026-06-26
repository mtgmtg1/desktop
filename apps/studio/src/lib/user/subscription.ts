// [Flow: Always treat user as PRO -> Skip server checks -> Cache locally]
import { MainChannels } from '@onlook/models/constants';
import { UsagePlanType } from '@onlook/models/usage';
import { makeAutoObservable } from 'mobx';
import { invokeMainChannel } from '../utils';

export class SubscriptionManager {
    plan: UsagePlanType = UsagePlanType.PRO;

    constructor() {
        makeAutoObservable(this);
        this.restoreCachedPlan();
        this.updatePlan(UsagePlanType.PRO);
    }

    private restoreCachedPlan() {
        const cachedPlan = localStorage?.getItem('currentPlan');
        this.plan = (cachedPlan as UsagePlanType) || UsagePlanType.PRO;
    }

    async updatePlan(plan: UsagePlanType) {
        this.plan = plan;
        localStorage.setItem('currentPlan', plan);
        await invokeMainChannel(MainChannels.UPDATE_USER_METADATA, { plan });
    }

    async getPlanFromServer(): Promise<UsagePlanType> {
        return UsagePlanType.PRO;
    }
}
