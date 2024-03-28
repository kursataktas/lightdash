import { subject } from '@casl/ability';
import {
    ForbiddenError,
    isUserWithOrg,
    SessionUser,
    ShareUrl,
    UpdateShareUrl,
} from '@lightdash/common';
import { nanoid as nanoidGenerator } from 'nanoid';
import { LightdashAnalytics } from '../../analytics/LightdashAnalytics';
import { LightdashConfig } from '../../config/parseConfig';
import { ShareModel } from '../../models/ShareModel';

type ShareServiceArguments = {
    analytics: LightdashAnalytics;
    shareModel: ShareModel;
    lightdashConfig: Pick<LightdashConfig, 'siteUrl'>;
};

export class ShareService {
    private readonly lightdashConfig: Pick<LightdashConfig, 'siteUrl'>;

    private readonly analytics: LightdashAnalytics;

    private readonly shareModel: ShareModel;

    constructor(args: ShareServiceArguments) {
        this.lightdashConfig = args.lightdashConfig;
        this.analytics = args.analytics;
        this.shareModel = args.shareModel;
    }

    private shareUrlWithHost(shareUrl: ShareUrl) {
        const host = this.lightdashConfig.siteUrl;
        return {
            ...shareUrl,
            host,
            shareUrl: `${host}/share/${shareUrl.nanoid}`,
            url: `${shareUrl.path}${shareUrl.params}`,
        };
    }

    async getShareUrl(user: SessionUser, nanoid: string): Promise<ShareUrl> {
        if (!isUserWithOrg(user)) {
            throw new ForbiddenError('User is not part of an organization');
        }
        const shareUrl = await this.shareModel.getSharedUrl(nanoid);

        if (
            user.ability.cannot(
                'view',
                subject('OrganizationMemberProfile', {
                    organizationUuid: shareUrl.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
        this.analytics.track({
            userId: user.userUuid,
            event: 'share_url.used',
            properties: {
                path: shareUrl.path,
                organizationId: user.organizationUuid,
            },
        });
        return this.shareUrlWithHost(shareUrl);
    }

    async updateShareUrl(
        user: SessionUser,
        nanoid: string,
        updateParams: UpdateShareUrl,
    ): Promise<ShareUrl> {
        if (!isUserWithOrg(user)) {
            throw new ForbiddenError('User is not part of an organization');
        }

        const shareUrl = await this.getShareUrl(user, nanoid);

        if (shareUrl.createdByUserUuid !== user.userUuid) {
            throw new ForbiddenError(
                'User is not original creator of share url',
            );
        }

        const updatedShareUrl: ShareUrl = {
            ...shareUrl,
            ...updateParams,
        };

        return this.shareModel.updateShareUrl(updatedShareUrl);
    }

    async createShareUrl(
        user: SessionUser,
        path: string,
        params: string,
    ): Promise<ShareUrl> {
        if (!isUserWithOrg(user)) {
            throw new ForbiddenError('User is not part of an organization');
        }
        const shareUrl = await this.shareModel.createSharedUrl({
            path,
            params,
            nanoid: nanoidGenerator(),
            organizationUuid: user.organizationUuid,
            createdByUserUuid: user.userUuid,
        });

        this.analytics.track({
            userId: user.userUuid,
            event: 'share_url.created',
            properties: {
                path: shareUrl.path,
                organizationId: user.organizationUuid,
            },
        });

        return this.shareUrlWithHost(shareUrl);
    }
}
