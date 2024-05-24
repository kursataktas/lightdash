import { Box, createStyles } from '@mantine/core';
import { type FC } from 'react';
import { Helmet } from 'react-helmet';

import { ProjectType } from '@lightdash/common';
import { useLockBodyScroll } from 'react-use';
import { ErrorBoundary } from '../../../features/errorBoundary';
import { useActiveProjectUuid } from '../../../hooks/useActiveProject';
import { useProjects } from '../../../hooks/useProjects';
import { TrackSection } from '../../../providers/TrackingProvider';
import { SectionName } from '../../../types/Events';
import AboutFooter, { FOOTER_HEIGHT, FOOTER_MARGIN } from '../../AboutFooter';
import { BANNER_HEIGHT, NAVBAR_HEIGHT } from '../../NavBar';
import { PAGE_HEADER_HEIGHT } from './PageHeader';
import Sidebar, { type SidebarWidthProps } from './Sidebar';

type StyleProps = {
    withCenteredContent?: boolean;
    withFitContent?: boolean;
    withFixedContent?: boolean;
    withFooter?: boolean;
    withFullHeight?: boolean;
    withHeader?: boolean;
    withNavbar?: boolean;
    withPaddedContent?: boolean;
    withSidebar?: boolean;
    withRightSidebar?: boolean;
    withSidebarFooter?: boolean;
    withRightSidebarFooter?: boolean;
    hasBanner?: boolean;
    lockScroll?: boolean;
};

export const PAGE_CONTENT_WIDTH = 900;
const PAGE_MIN_CONTENT_WIDTH = 600;

const usePageStyles = createStyles<string, StyleProps>((theme, params) => {
    let containerHeight = '100vh';

    if (params.withNavbar) {
        containerHeight = `calc(${containerHeight} - ${NAVBAR_HEIGHT}px)`;
    }
    if (params.withHeader) {
        containerHeight = `calc(${containerHeight} - ${PAGE_HEADER_HEIGHT}px)`;
    }
    if (params.hasBanner) {
        containerHeight = `calc(${containerHeight} - ${BANNER_HEIGHT}px)`;
    }

    return {
        root: {
            ...(params.withFullHeight
                ? {
                      height: containerHeight,
                      maxHeight: containerHeight,
                  }
                : {
                      height: containerHeight,

                      overflowY: 'auto',
                  }),

            ...(params.withSidebar || params.withRightSidebar
                ? {
                      display: 'flex',
                      flexDirection: 'row',
                  }
                : {}),
        },

        content: {
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,

            width: '100%',
            minWidth: PAGE_CONTENT_WIDTH,

            ...(params.withSidebar || params.withRightSidebar
                ? {
                      minWidth: PAGE_MIN_CONTENT_WIDTH,
                  }
                : {}),

            ...(params.withFooter
                ? {
                      minHeight: `calc(100% - ${FOOTER_HEIGHT}px - ${theme.spacing[FOOTER_MARGIN]} - 1px)`,
                  }
                : {}),

            ...(params.withFullHeight
                ? {
                      display: 'flex',
                      flexDirection: 'column',

                      height: '100%',
                      maxHeight: '100%',

                      overflowY: 'auto',
                  }
                : {}),

            ...(params.withFixedContent
                ? {
                      marginLeft: 'auto',
                      marginRight: 'auto',

                      width: PAGE_CONTENT_WIDTH,
                      flexShrink: 0,
                  }
                : {}),

            ...(params.withFitContent
                ? {
                      width: 'fit-content',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                  }
                : {}),

            ...(params.withPaddedContent
                ? {
                      paddingLeft: theme.spacing.lg,
                      paddingRight: theme.spacing.lg,
                  }
                : {}),

            ...(params.withCenteredContent
                ? {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                  }
                : {}),
        },
    };
});

type Props = {
    title?: string;
    lockScroll?: boolean;
    sidebar?: React.ReactNode;
    rightSidebar?: React.ReactNode;
    rightSidebarWidthProps?: SidebarWidthProps;
    isSidebarOpen?: boolean;
    isRightSidebarOpen?: boolean;
    header?: React.ReactNode;
} & Omit<StyleProps, 'withSidebar' | 'withHeader'>;

const Page: FC<React.PropsWithChildren<Props>> = ({
    lockScroll = false,
    title,
    header,
    sidebar,
    isSidebarOpen = true,
    rightSidebar,
    rightSidebarWidthProps,
    isRightSidebarOpen = false,

    withCenteredContent = false,
    withFitContent = false,
    withFixedContent = false,
    withFooter = false,
    withFullHeight = false,
    withNavbar = true,
    withPaddedContent = false,
    withSidebarFooter = false,
    withRightSidebarFooter = false,

    children,
}) => {
    useLockBodyScroll(lockScroll);
    const { activeProjectUuid } = useActiveProjectUuid({
        refetchOnMount: true,
    });
    const { data: projects } = useProjects();
    const isCurrentProjectPreview = !!projects?.find(
        (project) =>
            project.projectUuid === activeProjectUuid &&
            project.type === ProjectType.PREVIEW,
    );

    const { classes } = usePageStyles(
        {
            withCenteredContent,
            withFitContent,
            withFixedContent,
            withFooter,
            withFullHeight,
            withHeader: !!header,
            withNavbar,
            withPaddedContent,
            withSidebar: !!sidebar,
            withRightSidebar: !!rightSidebar,
            withSidebarFooter,
            withRightSidebarFooter,
            hasBanner: isCurrentProjectPreview,
            lockScroll,
        },
        { name: 'Page' },
    );

    return (
        <>
            {title ? (
                <Helmet>
                    <title>{title} - Lightdash</title>
                </Helmet>
            ) : null}

            {header}

            <Box className={classes.root}>
                {sidebar ? (
                    <Sidebar isOpen={isSidebarOpen} position="left">
                        <ErrorBoundary wrapper={{ mt: '4xl' }}>
                            {sidebar}
                        </ErrorBoundary>
                        {withSidebarFooter ? <AboutFooter minimal /> : null}
                    </Sidebar>
                ) : null}

                <Box component="main" className={classes.content}>
                    <TrackSection name={SectionName.PAGE_CONTENT}>
                        <ErrorBoundary wrapper={{ mt: '4xl' }}>
                            {children}
                        </ErrorBoundary>
                    </TrackSection>
                </Box>

                {rightSidebar ? (
                    <Sidebar
                        isOpen={isRightSidebarOpen}
                        position="right"
                        widthProps={rightSidebarWidthProps}
                    >
                        <ErrorBoundary wrapper={{ mt: '4xl' }}>
                            {rightSidebar}
                        </ErrorBoundary>
                        {withRightSidebarFooter ? (
                            <AboutFooter minimal />
                        ) : null}
                    </Sidebar>
                ) : null}
            </Box>
            {withFooter && !withSidebarFooter ? <AboutFooter /> : null}
        </>
    );
};

export default Page;
