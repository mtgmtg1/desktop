import type {
    CreateDomainVerificationResponse,
    CustomDomain,
    GetOwnedDomainsResponse,
    VerifyDomainResponse,
} from '@onlook/models/hosting';

export async function getCustomDomains(): Promise<CustomDomain[]> {
    return [];
}

export async function getOwnedDomains(): Promise<GetOwnedDomainsResponse> {
    return { success: false, message: 'Hosting disabled in local mode' };
}

export async function createDomainVerification(
    _domain: string,
): Promise<CreateDomainVerificationResponse> {
    return { success: false, message: 'Hosting disabled in local mode' };
}

export async function verifyDomain(_domain: string): Promise<VerifyDomainResponse> {
    return { success: false, message: 'Hosting disabled in local mode' };
}
