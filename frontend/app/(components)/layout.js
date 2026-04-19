"use client";
import React, { useEffect, useState } from 'react';
import  * as switcherdata from '@/shared/data/switcherdata/switcherdata';
import { connect } from 'react-redux';
import {ThemeChanger} from "@/shared/redux/action"

function Layout({ children, local_varaiable,ThemeChanger }) {

    const customstyles = {
        ...(local_varaiable.colorPrimaryRgb !== '' && { '--primary-rgb': local_varaiable.colorPrimaryRgb }),
        ...(local_varaiable.colorPrimary !== '' && { '--primary': local_varaiable.colorPrimary }),
        ...(local_varaiable.bgGradient !== '' && { '--gradient': local_varaiable.bgGradient }),
        ...(local_varaiable.bgLight !== '' && { '--light': local_varaiable.bgLight }),

    };

    useEffect(() => {
        switcherdata.LocalStorageBackup(ThemeChanger);
    }, []);


    return (
        <>
            <html
                suppressHydrationWarning={true}
                dir={local_varaiable.dir}
                data-theme-mode={local_varaiable.dataThemeMode}
                data-header-styles={local_varaiable.dataHeaderStyles}
                data-vertical-style={local_varaiable.dataVerticalStyle}
                data-card-background={local_varaiable.dataCardBackground}
                data-card-style={local_varaiable.dataCardStyle}
                data-nav-layout={local_varaiable.dataNavLayout}
                data-menu-styles={local_varaiable.dataMenuStyles}
                data-toggled={local_varaiable.dataToggled}
                data-nav-style={local_varaiable.dataNavStyle}
                hor-style={local_varaiable.horStyle}
                data-page-style={local_varaiable.dataPageStyle}
                data-width={local_varaiable.dataWidth}
                data-menu-position={local_varaiable.dataMenuPosition}
                data-header-position={local_varaiable.dataHeaderPosition}
                data-icon-overlay={local_varaiable.iconOverlay}
                data-bg-img={local_varaiable.bgImg}
                data-icon-text={local_varaiable.iconText}
                data-pattern-img={local_varaiable.patternImg}
                style={customstyles}
            >
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/dragula@3.7.3/dist/dragula.min.css" rel="stylesheet" />
                    <meta name="keywords" content="admin dashboard, admin panel, admin template, nextjs template, nextjs dashboard, next js themes, react bootstrap template, react bootstrap component, next js framework, nextjs admin template, router, framework front end, nextjs app, nextjs app router, template admin panel, nextjs, next js framework" />
                </head>
                <body className={`${local_varaiable.body ? local_varaiable.body : ''}`}>
                    {children}
                    <script src="https://cdn.jsdelivr.net/npm/dragula@3.7.3/dist/dragula.min.js"></script>
                </body>

            </html>
        </>

    );
};

const mapStateToProps = (state) => ({
    local_varaiable: state
});

export default connect(mapStateToProps, {ThemeChanger})(Layout);
