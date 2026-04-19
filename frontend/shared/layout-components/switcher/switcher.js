"use client";
import { Fragment} from 'react';
import Themeprimarycolor, * as switcherdata from "../../data/switcherdata/switcherdata";
import { connect } from "react-redux";
import { ThemeChanger } from "../../redux/action";
import { Button, Nav, Tab } from 'react-bootstrap';
import Link from 'next/link';

const Switcher = ({ local_varaiable, ThemeChanger }) => {


    const Switcherclose = () => {
        if (document.querySelector(".offcanvas-end")?.classList.contains("show")) {
            document.querySelector(".offcanvas-end")?.classList.remove("show");
            document.querySelector(".switcher-backdrop")?.classList.remove("d-block");
            document.querySelector(".switcher-backdrop")?.classList.add("d-none");
        }

    };
    return (
        <Fragment>
            <div className="switcher-backdrop d-none" onClick={() => { Switcherclose(); }}></div>
            <div className="offcanvas offcanvas-end" tabIndex={-1} id="switcher-canvas" aria-labelledby="offcanvasRightLabel">
                <div className="offcanvas-header border-bottom">
                    <h5 className="offcanvas-title text-default" id="offcanvasRightLabel">Switcher</h5>
                    <Button variant=''
                        onClick={() => {
                            Switcherclose();
                        }}
                        type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></Button>
                </div>

                <div className="offcanvas-body">
                    <Tab.Container id="left-tabs-example" defaultActiveKey="react">

                        <nav className="border-bottom border-block-end-dashed">
                            <Nav variant="pills" className="nav nav-tabs nav-justified switcher-main-tabs" id="switcher-main-tab" role="tablist">
                                <Nav.Item>
                                    <Nav.Link as="a" className="p-0" eventKey="react">
                                        <Button variant='' className="nav-link" id="switcher-home-tab" data-bs-toggle="tab" data-bs-target="#switcher-home"
                                            type="button" role="tab" aria-selected="true">Theme Styles</Button>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as="a" className="p-0" eventKey="firebase">
                                        <Button variant='' className="nav-link" id="switcher-profile-tab" data-bs-toggle="tab" data-bs-target="#switcher-profile"
                                            type="button" role="tab" aria-selected="false">Theme Colors</Button>
                                    </Nav.Link>
                                </Nav.Item>

                            </Nav>
                        </nav>
                        <Tab.Content className="tab-content" id="nav-tabContent">
                            <Tab.Pane eventKey="react">
                                <div className="">
                                    <p className="switcher-style-head">Directions:</p>
                                    <div className="row switcher-style gx-0">
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-ltr">
                                                    LTR
                                                </label>
                                                <input className="form-check-input" type="radio" name="direction" id="switcher-ltr"
                                                    checked={local_varaiable.dir == 'ltr'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Ltr(ThemeChanger); }} />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-rtl">
                                                    RTL
                                                </label>
                                                <input className="form-check-input" type="radio" name="direction" id="switcher-rtl"
                                                    checked={local_varaiable.dir == 'rtl'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Rtl(ThemeChanger); }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="">
                                    <p className="switcher-style-head">Navigation Styles:</p>
                                    <div className="row switcher-style gx-0">
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-vertical">
                                                    Vertical
                                                </label>
                                                <input className="form-check-input" type="radio" name="navigation-style" id="switcher-vertical"
                                                    checked={local_varaiable.dataNavLayout == 'vertical'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.Vertical(ThemeChanger)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-horizontal">
                                                    Horizontal
                                                </label>
                                                <input className="form-check-input" type="radio" name="navigation-style"
                                                    checked={local_varaiable.dataNavLayout == 'horizontal'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.HorizontalClick(ThemeChanger)}
                                                    id="switcher-horizontal" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="navigation-menu-styles">
                                    <p className="switcher-style-head">Vertical & Horizontal Menu Styles:</p>
                                    <div className="row switcher-style gx-0 pb-2 gy-2">
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-menu-click">
                                                    Menu Click
                                                </label>
                                                <input className="form-check-input" type="radio" name="navigation-menu-styles"
                                                    checked={local_varaiable.dataNavStyle == 'menu-click'} 
                                                    onChange={(_e) => { }}
                                                    onClick={() => switcherdata.Menuclick(ThemeChanger)}
                                                    id="switcher-menu-click" />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-menu-hover">
                                                    Menu Hover
                                                </label>
                                                <input className="form-check-input" type="radio" name="navigation-menu-styles"
                                                    checked={local_varaiable.dataNavStyle == 'menu-hover'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.MenuHover(ThemeChanger)}
                                                    id="switcher-menu-hover" />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-icon-click">
                                                    Icon Click
                                                </label>
                                                <input className="form-check-input" type="radio" name="navigation-menu-styles"
                                                    checked={local_varaiable.dataNavStyle == 'icon-click'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.IconClick(ThemeChanger)}
                                                    id="switcher-icon-click" />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-icon-hover">
                                                    Icon Hover
                                                </label>
                                                <input className="form-check-input" type="radio" name="navigation-menu-styles"
                                                    checked={local_varaiable.dataNavStyle == 'icon-hover'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.IconHover(ThemeChanger)}
                                                    id="switcher-icon-hover" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                	<div className="sidemenu-layout-styles">
									<p className="switcher-style-head">Sidemenu Layout Styles:</p>
									<div className="row switcher-style gx-0  gy-2">
										<div className="col-sm-6">
											<div className="form-check switch-select">
												<label className="form-check-label" htmlFor="switcher-default-menu">
													Default Menu
												</label>
												<input className="form-check-input" type="radio" name="sidemenu-layout-styles"
													id="switcher-default-menu"
													 onClick={() => switcherdata.Defaultmenu(ThemeChanger)} />
											</div>
										</div>
										<div className="col-sm-6">
											<div className="form-check switch-select">
												<label className="form-check-label" htmlFor="switcher-closed-menu">
													Closed Menu
												</label>
												<input className="form-check-input" type="radio" name="sidemenu-layout-styles"
													checked={local_varaiable.dataToggled == "close-menu-close"} onChange={(_e) => { }}
													onClick={() => switcherdata.Closedmenu(ThemeChanger)}
													id="switcher-closed-menu" />
											</div>
										</div>
										<div className="col-sm-6">
											<div className="form-check switch-select">
												<label className="form-check-label" htmlFor="switcher-icontext-menu">
													Icon Text
												</label>
												<input className="form-check-input" type="radio" name="sidemenu-layout-styles"
													checked={local_varaiable.dataToggled == "icon-text-close"} onChange={(_e) => { }}
													onClick={() => switcherdata.iconText(ThemeChanger)}
													id="switcher-icontext-menu" />
											</div>
										</div>
										<div className="col-sm-6">
											<div className="form-check switch-select">
												<label className="form-check-label" htmlFor="switcher-icon-overlay">
													Icon Overlay
												</label>
												<input className="form-check-input" type="radio" name="sidemenu-layout-styles"
													onClick={() => switcherdata.iconOverayFn(ThemeChanger)}
													id="switcher-icon-overlay" />
											</div>
										</div>
										<div className="col-sm-6">
											<div className="form-check switch-select">
												<label className="form-check-label" htmlFor="switcher-detached">
													Detached
												</label>
												<input className="form-check-input" type="radio" name="sidemenu-layout-styles"
													onClick={() => switcherdata.DetachedFn(ThemeChanger)} defaultChecked
													id="switcher-detached" />
											</div>
										</div>
										<div className="col-sm-6">
											<div className="form-check switch-select">
												<label className="form-check-label" htmlFor="switcher-double-menu">
													Double Menu
												</label>
												<input className="form-check-input" type="radio" name="sidemenu-layout-styles"
													checked={local_varaiable.dataVerticalStyle == "doublemenu"} onChange={(_e) => { }}
													onClick={() => switcherdata.DoubletFn(ThemeChanger)}
													id="switcher-double-menu" />
											</div>
										</div>
									</div>
								</div>
                                <div className="">
                                    <p className="switcher-style-head">Layout Width Styles:</p>
                                    <div className="row switcher-style gx-0">
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-full-width">
                                                    Full Width
                                                </label>
                                                <input className="form-check-input" type="radio" name="layout-width" id="switcher-full-width"
                                                    checked={local_varaiable.dataWidth == 'fullwidth'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.Fullwidth(ThemeChanger)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-boxed">
                                                    Boxed
                                                </label>
                                                <input className="form-check-input" type="radio" name="layout-width" id="switcher-boxed"
                                                    checked={local_varaiable.dataWidth == 'boxed'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.Boxed(ThemeChanger)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="">
                                    <p className="switcher-style-head">Menu Positions:</p>
                                    <div className="row switcher-style gx-0">
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-menu-fixed">
                                                    Fixed
                                                </label>
                                                <input className="form-check-input" type="radio" name="menu-positions" id="switcher-menu-fixed"
                                                    checked={local_varaiable.dataMenuPosition == 'fixed'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.FixedMenu(ThemeChanger)} />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-menu-scroll">
                                                    Scrollable
                                                </label>
                                                <input className="form-check-input" type="radio" name="menu-positions" id="switcher-menu-scroll"
                                                    checked={local_varaiable.dataMenuPosition == 'scrollable'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.scrollMenu(ThemeChanger)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="">
                                    <p className="switcher-style-head">Header Positions:</p>
                                    <div className="row switcher-style gx-0">
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-header-fixed">
                                                    Fixed
                                                </label>
                                                <input className="form-check-input" type="radio" name="header-positions"
                                                    id="switcher-header-fixed"
                                                    checked={local_varaiable.dataHeaderPosition == 'fixed'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.Headerpostionfixed(ThemeChanger)} />
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check switch-select">
                                                <label className="form-check-label" htmlFor="switcher-header-scroll">
                                                    Scrollable
                                                </label>
                                                <input className="form-check-input" type="radio" name="header-positions"
                                                    checked={local_varaiable.dataHeaderPosition == 'scrollable'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.Headerpostionscroll(ThemeChanger)}
                                                    id="switcher-header-scroll" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="firebase">
                                <div>
                                    <div className="theme-colors">
                                        <p className="switcher-style-head">Theme Primary:</p>
                                        <div className="d-flex flex-wrap align-items-center switcher-style">
                                            <div className="form-check switch-select me-3">
                                                <input className="form-check-input color-input color-primary-1" type="radio"
                                                    checked={local_varaiable.colorPrimaryRgb == '58, 88, 146'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.primaryColor1(ThemeChanger)}
                                                    name="theme-primary" id="switcher-primary" />
                                            </div>
                                            <div className="form-check switch-select me-3">
                                                <input className="form-check-input color-input color-primary-2" type="radio"
                                                    checked={local_varaiable.colorPrimaryRgb == '92, 144, 163'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.primaryColor2(ThemeChanger)}
                                                    name="theme-primary" id="switcher-primary1" />
                                            </div>
                                            <div className="form-check switch-select me-3">
                                                <input className="form-check-input color-input color-primary-3" type="radio" name="theme-primary"
                                                    checked={local_varaiable.colorPrimaryRgb == '161, 90, 223'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.primaryColor3(ThemeChanger)}
                                                    id="switcher-primary2" />
                                            </div>
                                            <div className="form-check switch-select me-3">
                                                <input className="form-check-input color-input color-primary-4" type="radio" name="theme-primary"
                                                    checked={local_varaiable.colorPrimaryRgb == '78, 172, 76'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.primaryColor4(ThemeChanger)}
                                                    id="switcher-primary3" />
                                            </div>
                                            <div className="form-check switch-select me-3">
                                                <input className="form-check-input color-input color-primary-5" type="radio" name="theme-primary"
                                                    checked={local_varaiable.colorPrimaryRgb == '223, 90, 90'} onChange={(_e) => { }}
                                                    onClick={() => switcherdata.primaryColor5(ThemeChanger)}
                                                    id="switcher-primary4" />
                                            </div>
                                            <div className="form-check switch-select ps-0 mt-1 color-primary-light">
                                                <div className='theme-container-primary'>
                                                    <button className="">nano</button>
                                                </div>
                                                <div className='pickr-container-primary'>
                                                    <div className='pickr'>
                                                        <button className='pcr-button' onClick={(ele) => {
                                                            if (ele.target.querySelector("input")) {
                                                                ele.target.querySelector("input").click();
                                                            }
                                                        }}>
                                                            <Themeprimarycolor theme={local_varaiable} actionfunction={ThemeChanger} />
                                                        </button>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pattern-image mb-3">
                                        <p className="switcher-style-head">Background Patterns:</p>
                                        <div className="d-flex flex-wrap align-items-center switcher-style">
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern1" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img" checked={local_varaiable.patternImg == 'bgpattern1'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern1(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern2" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img1" checked={local_varaiable.patternImg == 'bgpattern2'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern2(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern3" type="radio" name="background-pattern"
                                                    id="switcher-pattern-img2" checked={local_varaiable.patternImg == 'bgpattern3'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern3(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern4" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img3" checked={local_varaiable.patternImg == 'bgpattern4'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern4(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern5" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img4" checked={local_varaiable.patternImg == 'bgpattern5'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern5(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern6" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img5" checked={local_varaiable.patternImg == 'bgpattern6'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern6(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern7" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img6" checked={local_varaiable.patternImg == 'bgpattern7'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern7(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern8" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img7" checked={local_varaiable.patternImg == 'bgpattern8'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern8(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern9" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img8" checked={local_varaiable.patternImg == 'bgpattern9'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern9(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input patternimage-input bg-pattern10" type="radio"
                                                    name="background-pattern" id="switcher-pattern-img9" checked={local_varaiable.patternImg == 'bgpattern10'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Pattern10(ThemeChanger); }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-style mb-3">
                                        <p className="switcher-style-head">Card Styling:</p>
                                        <div className="d-flex flex-wrap align-items-center switcher-style">
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style1" type="radio"
                                                    name="card-style" id="switcher-card-style" checked={local_varaiable.dataCardStyle == 'style1'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card1(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style2" type="radio"
                                                    name="card-style" id="switcher-card-style1" checked={local_varaiable.dataCardStyle == 'style2'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card2(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style3" type="radio" name="card-style"
                                                    id="switcher-card-style2" checked={local_varaiable.dataCardStyle == 'style3'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card3(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style4" type="radio"
                                                    name="card-style" id="switcher-card-style3" checked={local_varaiable.dataCardStyle == 'style4'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card4(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style5" type="radio"
                                                    name="card-style" id="switcher-card-style4" checked={local_varaiable.dataCardStyle == 'style5'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card5(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style6" type="radio"
                                                    name="card-style" id="switcher-card-style5" checked={local_varaiable.dataCardStyle == 'style6'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card6(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style7" type="radio"
                                                    name="card-style" id="switcher-card-style6" checked={local_varaiable.dataCardStyle == 'style7'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card7(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style8" type="radio"
                                                    name="card-style" id="switcher-card-style7" checked={local_varaiable.dataCardStyle == 'style8'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card8(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style9" type="radio"
                                                    name="card-style" id="switcher-card-style8" checked={local_varaiable.dataCardStyle == 'style9'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card9(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-style10" type="radio"
                                                    name="card-style" id="switcher-card-style9" checked={local_varaiable.dataCardStyle == 'style10'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Card10(ThemeChanger); }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-background mb-3">
                                        <p className="switcher-style-head">Card Background:</p>
                                        <div className="d-flex flex-wrap align-items-center switcher-style">
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background1" type="radio"
                                                    name="card-background" id="switcher-card-background" checked={local_varaiable.dataCardBackground == 'background1'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background1(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background2" type="radio"
                                                    name="card-background" id="switcher-card-background1" checked={local_varaiable.dataCardBackground == 'background2'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background2(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background3" type="radio" name="card-background"
                                                    id="switcher-card-background2" checked={local_varaiable.dataCardBackground == 'background3'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background3(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background4" type="radio"
                                                    name="card-background" id="switcher-card-background3" checked={local_varaiable.dataCardBackground == 'background4'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background4(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background5" type="radio"
                                                    name="card-background" id="switcher-card-background4" checked={local_varaiable.dataCardBackground == 'background5'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background5(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background6" type="radio"
                                                    name="card-background" id="switcher-card-background5" checked={local_varaiable.dataCardBackground == 'background6'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background6(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background7" type="radio"
                                                    name="card-background" id="switcher-card-background6" checked={local_varaiable.dataCardBackground == 'background7'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background7(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background8" type="radio"
                                                    name="card-background" id="switcher-card-background7" checked={local_varaiable.dataCardBackground == 'background8'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background8(ThemeChanger); }} />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input card-input card-background9" type="radio"
                                                    name="card-background" id="switcher-card-background8" checked={local_varaiable.dataCardBackground == 'background9'} onChange={(_e) => { }}
                                                    onClick={() => { switcherdata.Background9(ThemeChanger); }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="menu-image mb-3">
                                        <p className="switcher-style-head">Menu With Background Image:</p>
                                        <div className="d-flex flex-wrap align-items-center switcher-style">
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input bgimage-input bg-img1" type="radio"
                                                    onClick={() => switcherdata.bgImage1(ThemeChanger)}
                                                    name="theme-background" id="switcher-bg-img" />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input bgimage-input bg-img2" type="radio"
                                                    onClick={() => switcherdata.bgImage2(ThemeChanger)}
                                                    name="theme-background" id="switcher-bg-img1" />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input bgimage-input bg-img3" type="radio" name="theme-background"
                                                    onClick={() => switcherdata.bgImage3(ThemeChanger)}
                                                    id="switcher-bg-img2" />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input bgimage-input bg-img4" type="radio"
                                                    onClick={() => switcherdata.bgImage4(ThemeChanger)}
                                                    name="theme-background" id="switcher-bg-img3" />
                                            </div>
                                            <div className="form-check switch-select m-2">
                                                <input className="form-check-input bgimage-input bg-img5" type="radio"
                                                    onClick={() => switcherdata.bgImage5(ThemeChanger)}
                                                    name="theme-background" id="switcher-bg-img4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Tab.Pane>
                            <div className="d-flex justify-content-between canvas-footer flex-sm-nowrap flex-wrap gap-2">
                                <a href="#!"  id="reset-all" className="btn btn-danger flex-fill w-100"
                                    onClick={() => switcherdata.Reset(ThemeChanger)}>Reset</a>
                            </div>
                        </Tab.Content>
                    </Tab.Container>
                </div>

            </div>
        </Fragment>
    );
};
const mapStateToProps = (state) => ({
    local_varaiable: state
});

export default connect(mapStateToProps, { ThemeChanger })(Switcher);

