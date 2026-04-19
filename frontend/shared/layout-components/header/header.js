"use client"
import { basePath } from '@/next.config';
import Link from 'next/link';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { Button, Dropdown, Form, InputGroup, ListGroup, Modal, Nav, Offcanvas, Tab } from 'react-bootstrap';
import MENUITEMS from '../sidebar/nav';
import store from '@/shared/redux/store';
import { connect } from 'react-redux';
import { ThemeChanger } from "../../redux/action";

const Header = ({ local_varaiable, ThemeChanger }) => {

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [show3, setShow3] = useState(false);
  const handleClose3 = () => setShow3(false);
  const handleShow3 = () => setShow3(true);
  //full screen
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const element = document.documentElement;
    if (
      !document.fullscreenElement &&
      !document.fullscreenElement &&
      !document.fullscreenElement
    ) {
      // Enter fullscreen mode
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else {
      // Exit fullscreen mode
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', fullscreenChangeHandler);

    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    };
  }, []);


  function menuClose() {
    const theme = store.getState();
    if (window.innerWidth <= 992) {
      ThemeChanger({ ...theme, dataToggled: "close" });
    }
    if (window.innerWidth >= 992) {
      ThemeChanger({ ...theme, dataToggled: local_varaiable.dataToggled ? local_varaiable.dataToggled : '' });
      // local_varaiable.dataHeaderStyles == 'dark' ? 'light' : 'dark',
    }
  }

  const ToggleSidebar = () => { 
    const theme = store.getState();
    let sidemenuType = theme.dataNavLayout;
    if (window.innerWidth >= 992) {
      if (sidemenuType === "vertical") {
        let verticalStyle = theme.dataVerticalStyle;
        const navStyle = theme.dataNavStyle;
        switch (verticalStyle) {
          // closed
          case "closed":
            ThemeChanger({ ...theme, "dataNavStyle": "" });
            if (theme.dataToggled === "close-menu-close") {
              ThemeChanger({ ...theme, "dataToggled": "" });
            } else {
              ThemeChanger({ ...theme, "dataToggled": "close-menu-close" });
            }
            break;
          // icon-overlay
          case "overlay":
            ThemeChanger({ ...theme, "dataNavStyle": "" });
            if (theme.dataToggled === "icon-overlay-close") {
              ThemeChanger({ ...theme, "dataToggled": "","iconOverlay" :''});
            } else {
              if (window.innerWidth >= 992) {
                ThemeChanger({ ...theme, "dataToggled": "icon-overlay-close","iconOverlay" :'' });
              }
            }
            break;
          // icon-text
          case "icontext":
            ThemeChanger({ ...theme, "dataNavStyle": "" });
            if (theme.dataToggled === "icon-text-close") {
              ThemeChanger({ ...theme, "dataToggled": "" });
            } else {
              ThemeChanger({ ...theme, "dataToggled": "icon-text-close" });
            }
            break;
          // doublemenu
          case "doublemenu":
            ThemeChanger({ ...theme, "dataNavStyle": "" });
            ThemeChanger({ ...theme, "dataNavStyle": "" });
              if (theme.dataToggled === "double-menu-open") {
                ThemeChanger({ ...theme, "dataToggled": "double-menu-close" });
              } else {
                let sidemenu = document.querySelector(".side-menu__item.active");
                if (sidemenu) {
                  ThemeChanger({ ...theme, "dataToggled": "double-menu-open" });
                  if (sidemenu.nextElementSibling) {
                    sidemenu.nextElementSibling.classList.add("double-menu-active");
                  } else {

                    ThemeChanger({ ...theme, "dataToggled": "double-menu-close" });
                    // ThemeChanger({ ...theme, "dataToggled": "" });
                  }
                }
              }
            // doublemenu(ThemeChanger);
            break;
          // detached
          case "detached":
            if (theme.dataToggled === "detached-close") {
              ThemeChanger({ ...theme, "dataToggled": "","iconOverlay" :'' });
            } else {
              ThemeChanger({ ...theme, "dataToggled": "detached-close","iconOverlay" :'' });
            }
            
            break;

          // default
          case "default":
            ThemeChanger({ ...theme, "dataToggled": "" });
        }
        switch (navStyle) {
          case "menu-click":
            if (theme.dataToggled === "menu-click-closed") {
              ThemeChanger({ ...theme, "dataToggled": "" });
            }
            else {
              ThemeChanger({ ...theme, "dataToggled": "menu-click-closed" });
            }
            break;
          // icon-overlay
          case "menu-hover":
            if (theme.dataToggled === "menu-hover-closed") {
              ThemeChanger({ ...theme, "dataToggled": "" });
            } else {
              ThemeChanger({ ...theme, "dataToggled": "menu-hover-closed"});

            }
            break;
          case "icon-click":
            if (theme.dataToggled === "icon-click-closed") {
              ThemeChanger({ ...theme, "dataToggled": "" });
            } else {
              ThemeChanger({ ...theme, "dataToggled": "icon-click-closed" });

            }
            break;
          case "icon-hover":
            if (theme.dataToggled === "icon-hover-closed") {
              ThemeChanger({ ...theme, "dataToggled": "" });
            } else {
              ThemeChanger({ ...theme, "dataToggled": "icon-hover-closed" });

            }
            break;

        }
      }
    }
    else {
      if (theme.dataToggled === "close") {
        ThemeChanger({ ...theme, "dataToggled": "open" });

        setTimeout(() => {
          if (theme.dataToggled == "open") {
            const overlay = document.querySelector("#responsive-overlay");

            if (overlay) {
              overlay.classList.add("active");
              overlay.addEventListener("click", () => {
                const overlay = document.querySelector("#responsive-overlay");

                if (overlay) {
                  overlay.classList.remove("active");
                  menuClose();
                }
              });
            }
          }

          window.addEventListener("resize", () => {
            if (window.screen.width >= 992) {
              const overlay = document.querySelector("#responsive-overlay");

              if (overlay) {
                overlay.classList.remove("active");
              }
            }
          });
        }, 100);
      } else {
        ThemeChanger({ ...theme, "dataToggled": "close" });
      }
    }
    
   

  };

  // search Functionality
  const searchRef = useRef(null);

  const handleClick = (event) => {
    const searchInput = searchRef.current;

    if (searchInput && (searchInput === event.target || searchInput.contains(event.target))) {
      document.querySelector(".header-search")?.classList.add("searchdrop");
    } else {
      document.querySelector(".header-search")?.classList.remove("searchdrop");
    }
  };

  useEffect(() => {
    document.body.addEventListener("click", handleClick);

    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  }, []);

  const [show1, setShow1] = useState(false);

  const handleClose1 = () => setShow1(false);
  const handleShow1 = () => setShow1(true);

  const [showa, setShowa] = useState(false);
  const [InputValue, setInputValue] = useState("");
  const [show2, setShow2] = useState(false);
  const [searchcolor, setsearchcolor] = useState("text-dark");
  const [searchval, setsearchval] = useState("Type something");
  const [NavData, setNavData] = useState([]);

  const myfunction = (inputvalue) => {
    document.querySelector(".search-result")?.classList.remove("d-none");

    const i = [];
    const allElement2 = [];

    MENUITEMS.forEach((mainLevel) => {
      if (mainLevel.children) {
        setShowa(true);
        mainLevel.children.forEach((subLevel) => {
          i.push(subLevel);
          if (subLevel.children) {
            subLevel.children.forEach((subLevel1) => {
              i.push(subLevel1);
              if (subLevel1.children) {
                subLevel1.children.forEach((subLevel2) => {
                  i.push(subLevel2);
                });
              }
            });
          }
        });
      }
    });
    for (const allElement of i) {
      if (allElement.title.toLowerCase().includes(inputvalue.toLowerCase())) {
        if (allElement.title.toLowerCase().startsWith(inputvalue.toLowerCase())) {
          setShow2(true);

          // Check if the element has a path and doesn't already exist in allElement2 before pushing
          if (allElement.path && !allElement2.some((el) => el.title === allElement.title)) {
            allElement2.push(allElement);
          }
        }
      }
    }

    if (!allElement2.length || inputvalue === "") {
      if (inputvalue === "") {
        setShow2(false);
        setsearchval("Type something");
        setsearchcolor("text-dark");
      }
      if (!allElement2.length) {
        setShow2(false);
        setsearchcolor("text-danger");
        setsearchval("There is no component with this name");
      }
    }
    setNavData(allElement2);

  };

  //Switcher icon
  const Switchericon = () => {
    document.querySelector(".offcanvas-end")?.classList.toggle("show");
    if (document.querySelector(".switcher-backdrop")?.classList.contains("d-none")) {
      document.querySelector(".switcher-backdrop")?.classList.add("d-block");
      document.querySelector(".switcher-backdrop")?.classList.remove("d-none");
    }
  };

  //Notifications

  const span1 = <span className="text-warning">ID: #1116773</span>
  const span2 = <span className="text-success">ID: 7731116</span>

  const span3 = <span className="font-[600] py-[0.25rem] px-[0.45rem] rounded-[0.25rem] bg-pinkmain/10 text-pink text-[0.625rem]">Free shipping</span>

  const img1 = <span className="avatar avatar-rounded"><img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/6.jpg`} /></span>
  const img2 = <span className="avatar avatar-rounded"><img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/23.jpg`} /></span>
  const img3 = <span className="avatar avatar-rounded"><img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/11.jpg`} /></span>
  const icon1 = <span className="avatar bg-success-transparent avatar-rounded"> <i className="ri-arrow-left-down-fill fs-18"></i> </span>
  const icon2 = <span className="avatar bg-info-transparent avatar-rounded"><i className="ri-calendar-schedule-line fs-18"></i></span>

  const notifydata = [
    { id: 1, src1: img1, heading: "Jessica Lily", data: "Reminder to complete your weekly tasks" },
    { id: 2, src1: img2, heading: "Payment Received", data: "You've been paid for freelance project." },
    { id: 3, src1: img3, heading: "New Message", data: "You've received a new message from a friend." },
    { id: 4, src1: icon1, heading: "Appointment Confirmed", data: "Your appointment for next week has been confirmed." },
    { id: 5, src1: icon2, heading: "Exclusive Offer", data: "Limited-time offer just for you! Check it out now." },
  ]

  const [notifications, setNotifications] = useState([...notifydata]);

  const handleNotificationClose = (index, event) => {
    if (event) {
      event.stopPropagation();
    }
    const updatedNotifications = [...notifications];
    updatedNotifications.splice(index, 1);
    setNotifications(updatedNotifications);
  };

  const handleRemoveNotification = (notificationId, event) => {
    if (event) {
      event.stopPropagation();
    }
    const updatedNotifications = notifications.filter((notification) => notification.id !== notificationId);
    setNotifications(updatedNotifications);
  };

  return (
    <Fragment>
      <header className="app-header sticky">
        <div className="main-header-container container-fluid">
          <div className="header-content-left">
            <div className="header-element">
              <div className="horizontal-logo">
                <Link href="/" className="header-logo">
                  <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-logo.png`} alt="logo" className="desktop-logo" />
                  <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-logo.png`} alt="logo" className="toggle-logo" />
                  <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/desktop-dark.png`} alt="logo" className="desktop-dark" />
                  <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/brand-logos/toggle-dark.png`} alt="logo" className="toggle-dark" />
                </Link>
              </div>
            </div>
            <div className="header-element mx-lg-0 mx-2" onClick={() => ToggleSidebar()}>
              <Link aria-label="Hide Sidebar" className="sidemenu-toggle header-link animated-arrow hor-toggle horizontal-navtoggle" data-bs-toggle="sidebar" href="#!" scroll={false}><span></span></Link>
            </div>
          </div>
          <ul className="header-content-right">
            <li className="header-element header-search d-md-block d-none">
              <input type="text" className="header-search-bar form-control border-0" placeholder="Search for results..."
                onClick={() => { }}
                autoComplete="off"
                ref={searchRef}
                defaultValue={InputValue}
                onChange={(ele => { myfunction(ele.target.value); setInputValue(ele.target.value); })} />
              {showa ?
                <div className="card search-result position-absolute z-index-9 search-fix  border mt-1">
                  <div className="card-header">
                    <div className="card-title me-2 text-break">Search result of {InputValue}</div>
                  </div>
                  <ListGroup className='m-2'>
                    {show2 ?
                      NavData.map((e) =>
                        <ListGroup.Item key={Math.random()} className="">
                          <Link href={`${e.path}/`} className='search-result-item' onClick={() => { setShow1(false), setInputValue(""); }}>{e.title}</Link>
                        </ListGroup.Item>
                      )
                      : <b className={`${searchcolor} `}>{searchval}</b>}
                  </ListGroup>

                </div>
                : ""}
              <Link href="#!" scroll={false} className="header-search-icon border-0">
                <i className="bi bi-search"></i>
              </Link>
            </li>
            <li className="header-element d-md-none d-block">
              <Link href="#!" scroll={false} className="header-link" onClick={handleShow3} data-bs-toggle="modal" data-bs-target="#header-responsive-search">
                <i className="bi bi-search header-link-icon"></i>
              </Link>
            </li>


            <Dropdown className="header-element country-selector dropdown">
              <Dropdown.Toggle as="a" href="#!" className="header-link dropdown-toggle" data-bs-auto-close="outside" data-bs-toggle="dropdown">
                <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/us_flag.jpg`} alt="img" className="header-link-icon" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="main-header-dropdown dropdown-menu dropdown-menu-end" data-popper-placement="none">
                <Link className="dropdown-item d-flex align-items-center" href="#!" scroll={false}>
                  <span className="avatar avatar-xs lh-1 me-2">
                    <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/us_flag.jpg`} alt="img" />
                  </span>
                  English
                </Link>
                <Link className="dropdown-item d-flex align-items-center" href="#!" scroll={false}>
                  <span className="avatar avatar-xs lh-1 me-2">
                    <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/spain_flag.jpg`} alt="img" />
                  </span>
                  Spanish
                </Link>
                <Link className="dropdown-item d-flex align-items-center" href="#!" scroll={false}>
                  <span className="avatar avatar-xs lh-1 me-2">
                    <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/french_flag.jpg`} alt="img" />
                  </span>
                  French
                </Link>
                <Link className="dropdown-item d-flex align-items-center" href="#!" scroll={false}>
                  <span className="avatar avatar-xs lh-1 me-2">
                    <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/germany_flag.jpg`} alt="img" />
                  </span>
                  German
                </Link>
                <Link className="dropdown-item d-flex align-items-center" href="#!" scroll={false}>
                  <span className="avatar avatar-xs lh-1 me-2">
                    <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/italy_flag.jpg`} alt="img" />
                  </span>
                  Italian
                </Link>
                <Link className="dropdown-item d-flex align-items-center" href="#!" scroll={false}>
                  <span className="avatar avatar-xs lh-1 me-2">
                    <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/flags/russia_flag.jpg`} alt="img" />
                  </span>
                  Russian
                </Link>
              </Dropdown.Menu>
            </Dropdown>
            <li className="header-element header-fullscreen">
              <Link onClick={toggleFullscreen} href="#!" scroll={false} className="header-link">
                {isFullscreen ? (
                  <i className="bi bi-fullscreen-exit full-screen-close header-link-icon"></i>
                ) : (
                  <i className="bi bi-fullscreen full-screen-open header-link-icon"></i>
                )}
              </Link>
            </li>
            <li className="header-element">
              <Link href="#!" scroll={false} className="header-link" data-bs-toggle="offcanvas" data-bs-target="#apps-header-offcanvas" onClick={handleShow}>
                <i className="bi bi-grid header-link-icon"></i>
              </Link>
            </li>
            <Dropdown className="header-element notifications-dropdown  dropdown">
              <Dropdown.Toggle as="a" href="#!" className="header-link dropdown-toggle no-caret" data-bs-auto-close="outside" data-bs-toggle="dropdown">
                <i className="bi bi-bell header-link-icon"></i>
                <span className="header-icon-pulse bg-warning rounded pulse"></span>
              </Dropdown.Toggle>
              <Dropdown.Menu className="main-header-dropdown dropdown-menu dropdown-menu-end" data-popper-placement="none">
                <div className="p-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0 fs-16">Notifications</p>
                    <span className="badge bg-secondary-transparent" id="notifiation-data">{notifications.length}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <ul className="list-unstyled mb-0 overflow-y-scroll" id="header-notification-scroll">
                  {notifications.map((idx, index) => (
                    <Dropdown.Item as="li" className="dropdown-item" key={Math.random()}>
                      <div className="d-flex align-items-center">
                        <div className="pe-2 lh-1">
                          {idx.src1}
                        </div>
                        <div className="flex-grow-1 d-flex align-items-center justify-content-between">
                          <div>
                            <p className="mb-0 fw-medium"><Link href="/pages/notifications" scroll={false}>{idx.heading}</Link></p>
                            <span className="text-muted fw-normal fs-12 header-notification-text">{idx.data}</span>
                          </div>
                          <div>
                            <Link href="#!" onClick={(event) => handleNotificationClose(index, event)} scroll={false} className="min-w-fit-content text-muted me-1 dropdown-item-close1"><i className="bi bi-x fs-16"></i></Link>
                          </div>
                        </div>
                      </div>
                    </Dropdown.Item>
                  ))}
                </ul>
                <div className={`p-3 empty-header-item1 border-top ${notifications.length === 0 ? 'd-none' : 'block'}`}>
                  <div className="text-center">
                    <Link href="/pages/notifications" className="link-primary text-decoration-underline">View All</Link>
                  </div>
                </div>
                <div className={`p-5 empty-item1 ${notifications.length === 0 ? 'block' : 'd-none'}`}>
                  <div className="text-center">
                    <span className="avatar avatar-xl avatar-rounded bg-secondary-transparent">
                      <i className="bi bi-bell-slash fs-2"></i>
                    </span>
                    <h6 className="fw-medium mt-3">No New Notifications</h6>
                  </div>
                </div>
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown className="header-element dropdown">
              <Dropdown.Toggle as="a" href="#!" className="header-link dropdown-toggle no-caret" id="mainHeaderProfile" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                <div className="d-flex align-items-center">
                  <div>
                    <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/22.jpg`} alt="img" className="avatar avatar-sm rounded-0" />
                  </div>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu as="ul" className="main-header-dropdown dropdown-menu pt-0 overflow-hidden header-profile-dropdown dropdown-menu-end" aria-labelledby="mainHeaderProfile">
                <Dropdown.Item as="li"><Link className="d-flex align-items-center" href="/pages/profile"><i className="bi bi-person fs-18 me-2 op-7"></i>Profile</Link></Dropdown.Item>
                <Dropdown.Item as="li"><Link className="d-flex align-items-center" href="/pages/email/mail-app"><i className="bi bi-envelope fs-16 me-2 op-7"></i>Inbox <span className="ms-auto badge bg-info">17</span></Link></Dropdown.Item>
                <Dropdown.Item as="li"><Link className="d-flex align-items-center" href="/pages/todolist"><i className="bi bi-check-square fs-16 me-2 op-7"></i>Task Manager</Link></Dropdown.Item>
                <Dropdown.Item as="li"><Link className="d-flex align-items-center" href="/pages/email/mail-settings"><i className="bi bi-gear fs-16 me-2 op-7"></i>Settings</Link></Dropdown.Item>
                <Dropdown.Item as="li"><Link className="d-flex align-items-center" href="/pages/chat"><i className="bi bi-headset fs-18 me-2 op-7"></i>Support</Link></Dropdown.Item>
                <Dropdown.Item as="li"><Link className="d-flex align-items-center" href="/authentication/sign-in/signin-cover"><i className="bi bi-box-arrow-right fs-18 me-2 op-7"></i>Log Out</Link></Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <li className="header-element">
              <Link href="#!" scroll={false} onClick={() => Switchericon()} className="header-link switcher-icon" data-bs-toggle="offcanvas" data-bs-target="#switcher-canvas">
                <i className="bi bi-gear header-link-icon border-0"></i>
              </Link>
            </li>
          </ul>
          <Modal show={show3} onHide={handleClose3} className="fade show" id="header-responsive-search" tabindex="-1" aria-labelledby="header-responsive-search" role="dialog">
            <div className="">
              <Modal.Body className="">
                <InputGroup>
                  <Form.Control type="text" className="border-end-0" placeholder="Search Anything ..." aria-label="Search Anything ..." aria-describedby="button-addon2" />
                  <Button variant='primary' className="btn" type="button" id="button-addon2"><i className="bi bi-search"></i></Button>
                </InputGroup>
              </Modal.Body>
            </div>
          </Modal>
        </div>
      </header>
      <Offcanvas placement="end" show={show} onHide={handleClose} className="offcanvas-end" id="apps-header-offcanvas">
        <Offcanvas.Header className="border-bottom">
          <h6 className="offcanvas-title" id="offcanvasExampleLabel">Shortcuts</h6>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" onClick={handleClose}></button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="panel tabs-style2">
            <Tab.Container defaultActiveKey="side1">
              <div className="panel-head">
                <Nav className="d-flex  app-header-nav-tabs">
                  <Nav.Item className="mb-2 flex-grow-1 text-center"><Nav.Link eventKey="side1" className="" data-bs-toggle="tab" href="#side1"><i
                    className="bi bi-chat me-2 d-inline-block"></i> Chat</Nav.Link></Nav.Item>
                  <Nav.Item className=" flex-grow-1 text-center mb-sm-0 mb-2"><Nav.Link eventKey="side2" className="" data-bs-toggle="tab"
                    href="#side2"><i className="bi bi-person-gear me-2 d-inline-block"></i> Settings</Nav.Link></Nav.Item>
                </Nav>
              </div>
              <div className="panel-body">
                <Tab.Content>
                  <Tab.Pane eventKey="side1" className="p-0" id="side1">
                    <div className="text-end m-3">
                      <Link href="/pages/email/mail-settings" className="text-primary">Mail Settings</Link>
                    </div>
                    <div className="px-3 pt-0 pb-3 border-bottom border-block-end-dashed">
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-3">
                        <p className="mb-0 font-weight-semibold">Messages</p>
                        <Link href="/pages/email/mail-app" className="btn btn-sm btn-primary-light btn-icon btn-icon"><i className="ri-chat-1-line"></i></Link>
                      </div>
                      <ul className="list-unstyled mb-0 mt-2">
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/5.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Elizabeth Ava<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">2</span><span
                                    className="ms-2"><i className="ti-pin-alt fs-11 text-muted"></i></span></h6>
                                <span className="fs-11 text-muted ms-auto my-auto">3:55 PM</span>
                              </div>
                              <p className="mb-0 fs-12 text-muted d-flex align-items-center">Elizabeth is
                                online</p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/9.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">George Rhys<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">1</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">12:04 PM</span>
                              </div>
                              <p className="mb-0 fs-12 text-muted d-flex align-items-center">I must explain...</p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/8.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Bethany Isla<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">2</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">Yesterday</span>
                              </div>
                              <p className="mb-0 fs-12">We denounce with righteous..</p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/3.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Margaret Emma<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">1</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">01 Mar</span>
                              </div>
                              <p className="mb-0 fs-12 text-muted d-flex align-items-center"><i
                                className="fe fe-link-2 me-1 fs-12 text-primary"></i><Link
                                  href="#!;">http://Diam-duoet.xd</Link></p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-0">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/10.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Michael Souris<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">1</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">22 Feb</span>
                              </div>
                              <p className="mb-0 fs-12 text-muted d-flex align-items-center"><i
                                className="fe fe-image me-1 fs-12 text-primary"></i>+13 photos</p>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="text-end mt-2">
                        <Link href="/pages/chat" className="text-primary">View All</Link>
                      </div>
                    </div>
                    <div className="p-3 border-bottom border-block-end-dashed">
                      <div className="d-flex align-items-center justify-content-between gap-1 my-3">
                        <p className="mb-0 font-weight-semibold">Workspace</p>
                        <Link href="/pages/email/mail-app" className="btn btn-sm btn-primary-light btn-icon btn-icon"><i className="ri-add-circle-line"></i></Link>
                      </div>
                      <ul className="list-unstyled mb-0 mt-1">
                        <li className="mb-3">
                          <div className="d-flex">
                            <div className="avatar avatar  shadow bg-primary-transparent">
                              <i className="ri-user-line"></i>
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Olivia Lily<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">1</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">2:00 PM</span>
                              </div>
                              <p className="mb-0 fs-12">Aliquyam ipsum sit.</p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex">
                            <div className="avatar avatar  shadow bg-secondary-transparent">
                              <i className="ri-arrow-right-circle-line"></i>
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Smith Brown<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">2</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">12:00 PM</span>
                              </div>
                              <p className="mb-0 fs-12">At eos no sit...</p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex">
                            <div className="avatar avatar  shadow bg-warning-transparent">
                              <i className="ri-drag-move-line"></i>
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Wilson Li<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">24</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">16 Feb</span>
                              </div>
                              <p className="mb-0 fs-12">Sit est dolor dolor.</p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex">
                            <div className="avatar avatar  shadow bg-success-transparent">
                              <i className="ri-home-8-line"></i>
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Jones Morton<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">3</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">12 Jan </span>
                              </div>
                              <p className="mb-0 fs-12">Erat diam ipsum... Sed dolor...</p>
                            </div>
                          </div>
                        </li>
                        <li className="mb-0">
                          <div className="d-flex">
                            <div className="avatar avatar  shadow bg-danger-transparent">
                              <i className="ri-global-line"></i>
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">White Lee<span
                                  className="badge bg-primary-transparent fs-11 ms-2 font-weight-normal">1</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">01 Feb</span>
                              </div>
                              <p className="mb-0 fs-12">Justo accusam stet eirmod et....</p>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="text-end mt-2">
                        <Link href="/pages/chat" className="text-primary">View All</Link>
                      </div>
                    </div>
                    <div className="p-3 border-bottom border-block-end-dashed">
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-3">
                        <p className="mb-0 font-weight-semibold">Calls</p>
                        <Link href="/pages/contacts" className="btn btn-sm btn-primary-light btn-icon btn-icon"><i className="ri-phone-line"></i></Link>
                      </div>
                      <ul className="list-unstyled mb-0 mt-2">
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/14.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Wilfrid Price<span
                                  className="badge bg-danger-transparent text-danger fs-11 ms-2 font-weight-normal">3</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">11:15 AM</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between gap-1">
                                <p className="mb-0 fs-12 text-muted d-flex align-items-center"><i
                                  className="fe fe-x me-1 fs-13 text-danger"></i>Missed call</p>
                                <span className="text-primary"><i className="fe fe-phone"></i></span>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap" data-bs-toggle="modal"
                              data-bs-target="#videoModal"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/7.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Jasmin O'Kon</h6>
                                <span className="fs-11 text-muted ms-auto my-auto">Yesterday</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between gap-1">
                                <p className="mb-0 fs-12 text-muted d-flex align-items-center"><i
                                  className="fe fe-arrow-down-left me-1 fs-13 text-primary"></i>Duration:
                                  15:30</p>
                                <span className="text-primary"><i className="fe fe-video"></i></span>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap" data-bs-toggle="modal"
                              data-bs-target="#videoModal"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/4.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">River Gleichner</h6>
                                <span className="fs-11 text-muted ms-auto my-auto">01 Mar</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between gap-1">
                                <p className="mb-0 fs-12 text-muted d-flex align-items-center"><i
                                  className="fe fe-arrow-up-right me-1 fs-13 text-primary"></i>Declined
                                </p>
                                <span className="text-primary"><i className="fe fe-video"></i></span>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li className="mb-3">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/12.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Saul Goodmate<span
                                  className="badge bg-danger-transparent text-danger fs-11 ms-2 font-weight-normal">1</span>
                                </h6>
                                <span className="fs-11 text-muted ms-auto my-auto">20 Feb</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between gap-1">
                                <p className="mb-0 fs-12 text-muted d-flex align-items-center"><i
                                  className="fe fe-x me-1 fs-13 text-danger"></i>Missed call</p>
                                <span className="text-primary"><i className="fe fe-phone"></i></span>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li className="mb-0">
                          <div className="d-flex pos-relative">
                            <Link href="#!" scroll={false} className="link-overlap"></Link>
                            <div className="main-img-user avatar d-none d-sm-block">
                              <img alt="avatar" className="shadow" src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/faces/13.jpg`} />
                            </div>
                            <div className="flex-grow-1 ms-2 fs-13">
                              <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                <h6 className="mb-0">Edgardo Huel</h6>
                                <span className="fs-11 text-muted ms-auto my-auto">15 Feb</span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between gap-1">
                                <p className="mb-0 fs-12 text-muted d-flex align-items-center"><i
                                  className="fe fe-arrow-down-left me-1 fs-13 text-success"></i>Duration:
                                  01:20:10</p>
                                <span className="text-primary"><i className="fe fe-phone"></i></span>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="text-end mt-3">
                        <Link href="/pages/chat" className="text-primary">View All</Link>
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="svg-card overflow-hidden">
                        <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/media/media-67.jpg`} alt="" />
                      </div>
                      <h6 className="mt-3">Find out more !</h6>
                      <Link href="/pages/email/mail-settings" className="btn btn-outline-primary btn-block">Mail Settings</Link>
                    </div>
                  </Tab.Pane>
                  <Tab.Pane eventKey="side2" className="p-0" id="side2">
                    <div className="p-3 border-bottom">
                      <h6>Notifications :</h6>
                      <div className="panel mt-2 tabs-style5">
                        <Tab.Container defaultActiveKey="data1">
                          <div className="panel-head">
                            <Nav className="app-header-nav-tabs tab-style-2 mb-3">
                              <Nav.Item className="flex-grow-1 text-center"><Nav.Link eventKey="data1" className="" data-bs-toggle="tab"
                                href="#tab_chat">Home</Nav.Link></Nav.Item>
                              <Nav.Item className="flex-grow-1 text-center"><Nav.Link eventKey="data2" className="" data-bs-toggle="tab" href="#tab_tasks">Tasks</Nav.Link>
                              </Nav.Item>
                            </Nav>
                          </div>
                          <div className="panel-body p-0">
                            <Tab.Content className="">
                              <Tab.Pane eventKey="data1" className="rounded-0 border border-dashed " id="tab_chat">
                                <div className="mt-0">
                                  <div className="d-flex align-items-center justify-content-between gap-1">
                                    <label className="text-muted d-flex align-items-center">Someone
                                      mentioned</label>
                                    <div className="custom-toggle-switch ms-auto">
                                      <input id="some" name="toggleswitchsize" type="checkbox" />
                                      <label htmlFor="some" className="label-primary mb-1"></label>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <div className="d-flex align-items-center justify-content-between gap-1">
                                    <label className="text-muted d-flex align-items-center">Someone
                                      Replies</label>
                                    <div className="custom-toggle-switch ms-auto">
                                      <input id="reply" name="toggleswitchsize" type="checkbox" />
                                      <label htmlFor="reply" className="label-primary mb-1"></label>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <div className="d-flex align-items-center justify-content-between gap-1">
                                    <label className="text-muted d-flex align-items-center">Allow All
                                      Notifications</label>
                                    <div className="custom-toggle-switch ms-auto">
                                      <input id="notify-allow" name="toggleswitchsize" type="checkbox" defaultChecked />
                                      <label htmlFor="notify-allow" className="label-primary mb-1"></label>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between gap-1 mt-3 flex-wrap">
                                  <label className="text-muted mb-0">Notifications On</label>
                                  <div className="btn-group" role="group" aria-label="Basic radio toggle button group">
                                    <input type="radio" className="btn-check" name="radioChat" id="radio1" />
                                    <label className="btn btn-sm btn-outline-primary mb-0" htmlFor="radio1">In App</label>

                                    <input type="radio" className="btn-check" name="radioChat" id="radio2" defaultChecked />
                                    <label className="btn btn-sm btn-outline-primary mb-0" htmlFor="radio2">Email</label>

                                    <input type="radio" className="btn-check" name="radioChat" id="radio3" />
                                    <label className="btn btn-sm btn-outline-primary mb-0" htmlFor="radio3">Both</label>
                                  </div>
                                </div>
                              </Tab.Pane>
                              <Tab.Pane eventKey="data2" className="rounded-0 border border-dashed" id="tab_tasks">
                                <div className="mt-0">
                                  <div className="d-flex align-items-center justify-content-between gap-1">
                                    <label className="text-muted d-flex align-items-center">Assigned a
                                      Task</label>
                                    <div className="custom-toggle-switch ms-auto">
                                      <input id="task" name="toggleswitchsize" type="checkbox" />
                                      <label htmlFor="task" className="label-primary mb-1"></label>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <div className="d-flex align-items-center justify-content-between gap-1">
                                    <label className="text-muted d-flex align-items-center">If I Have More
                                      Than 24 Tasks</label>
                                    <div className="custom-toggle-switch ms-auto">
                                      <input id="listed" name="toggleswitchsize" type="checkbox" />
                                      <label htmlFor="listed" className="label-primary mb-1"></label>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <div className="d-flex align-items-center justify-content-between gap-1">
                                    <label className="text-muted d-flex align-items-center">Allow All
                                      Notifications</label>
                                    <div className="custom-toggle-switch ms-auto">
                                      <input id="all-notify" name="toggleswitchsize" type="checkbox" defaultChecked />
                                      <label htmlFor="all-notify" className="label-primary mb-1"></label>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between gap-1 mt-3 flex-wrap">
                                  <label className="text-muted mb-0">Notifications On</label>
                                  <div className="btn-group" role="group" aria-label="Basic radio toggle button group">
                                    <input type="radio" className="btn-check" name="radioTasks" id="radio4" defaultChecked />
                                    <label className="btn btn-sm btn-outline-primary mb-0" htmlFor="radio4">In App</label>

                                    <input type="radio" className="btn-check" name="radioTasks" id="radio5" />
                                    <label className="btn btn-sm btn-outline-primary mb-0" htmlFor="radio5">Email</label>

                                    <input type="radio" className="btn-check" name="radioTasks" id="radio6" />
                                    <label className="btn btn-sm btn-outline-primary mb-0" htmlFor="radio6">Both</label>
                                  </div>
                                </div>
                              </Tab.Pane>
                            </Tab.Content>
                          </div>
                        </Tab.Container>
                      </div>
                    </div>
                    <div className="p-3 border-bottom">
                      <h6>App :</h6>
                      <div className="panel mt-2 tabs-style5">
                        <Tab.Container defaultActiveKey="files">
                          <div className="panel-head">
                            <Nav className="app-header-nav-tabs tab-style-2 mb-3">
                              <Nav.Item className="flex-grow-1 text-center"><Nav.Link eventKey="files" className="" data-bs-toggle="tab"
                                href="#tab_apps">Files</Nav.Link></Nav.Item>
                              <Nav.Item className="flex-grow-1 text-center"><Nav.Link eventKey="profile" className="" data-bs-toggle="tab" href="#tab_profile">Profile</Nav.Link>
                              </Nav.Item>
                            </Nav>
                          </div>
                          <div className="panel-body p-0">
                            <Tab.Content>
                              <Tab.Pane eventKey="files" className="rounded-0 border border-dashed" id="tab_apps">
                                <div className="mt-3">
                                  <p className="mb-0">Files : </p>
                                  <div className="mt-3">
                                    <div className="mb-0 d-flex align-items-center justify-content-between gap-1">
                                      <span className="text-muted">
                                        <i className="ri-folder-image-fill me-2 d-inline-block fs-18 text-primary"></i>
                                        Images
                                      </span>

                                      <div className=" ms-auto=">
                                        1,458
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="mb-0 d-flex align-items-center justify-content-between gap-1">
                                      <span className="text-muted">
                                        <i className="ri-live-line me-2 d-inline-block fs-18 text-secondary"></i>
                                        Videos
                                      </span>

                                      <div className=" ms-auto=">
                                        213
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="mb-0 d-flex align-items-center justify-content-between gap-1">
                                      <span className="text-muted">
                                        <i className="ri-database-2-line me-2 d-inline-block fs-18 text-success"></i>
                                        Storage
                                      </span>

                                      <div className=" ms-auto text-success">
                                        8.50MB free space
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <p className="mb-0">Files Privacy Settings :</p>
                                  <div className="mt-3">
                                    <div className="form-group mb-0">
                                      <p className="mb-2 d-flex align-items-center justify-content-between gap-1">
                                        <label htmlFor="inputPassword" className="mb-0 text-muted">Password</label>
                                        <Link href="#!" scroll={false} className="fs-11 text-primary" id="changePassword">change</Link>
                                      </p>
                                      <input type="password" className="form-control form-contron-sm radius-4" id="inputPassword"
                                        placeholder="Enter New Password" defaultValue="passwordzem" />
                                      <div className="mt-2 d-none" id="reEnterPassword">
                                        <input type="password" className="form-control form-contron-sm radius-4" id="inputPasswordTwo"
                                          placeholder="Re-Enter Password" />
                                        <div className="btn-list mt-2 text-end">
                                          <Link href="#!" scroll={false} className="text-danger" id="closePassword">Discard</Link>
                                          <Link href="#!" scroll={false} className="btn btn-sm btn-primary ms-3">Save
                                            Changes</Link>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="mb-0 d-flex align-items-center justify-content-between gap-1">
                                      <span className="text-muted d-flex align-items-center">Two Factor
                                        Authentication</span>
                                      <div className="custom-toggle-switch ms-auto">
                                        <input id="authentication" name="toggleswitchsize" type="checkbox" defaultChecked />
                                        <label htmlFor="authentication" className="label-primary mb-1"></label>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <div className="form-group mb-0">
                                      <p className="mb-0 d-flex align-items-center justify-content-between gap-1">
                                        <label htmlFor="inputPassword" className="mb-0 text-muted">Recent Deleted Files</label>
                                        <Link href="#!" scroll={false} className="btn btn-sm btn-outline-danger mt-2">Delete All</Link>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </Tab.Pane>
                              <Tab.Pane eventKey="profile" className="border border-dashed rounded-0" id="tab_profile">
                                <div className="mt-3">
                                  <div className="form-group mb-3">
                                    <label className="text-muted" htmlFor="inputName">Full Name</label>
                                    <input type="text" className="form-control radius-4" id="inputName" placeholder="Enter Full Name"
                                      defaultValue="Json Taylor" />
                                  </div>
                                  <div className="form-group mb-3">
                                    <label className="text-muted" htmlFor="inputMail">Email</label>
                                    <input type="email" className="form-control radius-4" id="inputMail" placeholder="Enter Your Mail"
                                      defaultValue="nicktaylor@Sprukosoftware.me" />
                                  </div>
                                  <div className="form-group mb-3">
                                    <label htmlFor="inputNumber" className="text-muted d-flex align-items-center justify-content-between gap-1">
                                      Mobile Number
                                      <Link href="#!" scroll={false} className="fs-11 text-primary">Change number</Link>
                                    </label>
                                    <div className="input-group">
                                      <span className="input-group-text br-ts-20 br-bs-20">+91</span>
                                      <input type="number" className="form-control br-te-4 br-be-4" id="inputNumber"
                                        placeholder="Enter Your Number" defaultValue="1212313231" />
                                    </div>
                                  </div>
                                </div>
                              </Tab.Pane>
                            </Tab.Content>
                          </div>
                        </Tab.Container>
                      </div>
                    </div>
                    <div className="p-3 border-bottom">
                      <h6>Remaiders :</h6>
                      <div className="mt-3">
                        <div className="d-flex align-items-center justify-content-between gap-1">
                          <label className="text-muted">Get alert for remaiders</label>
                          <div className="custom-toggle-switch ms-auto">
                            <input id="mails-images" name="toggleswitchsize" type="checkbox" defaultChecked />
                            <label htmlFor="mails-images" className="label-primary mb-1"></label>
                             </div>
                          <span className="custom-switch-indicator"></span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-center">
                        <img src={`${process.env.NODE_ENV === 'production' ? basePath : ''}/assets/images/media/media-66.png`} alt="" />
                        <h6 className="mt-4">This Is Not You're Looking For?</h6>
                        <Link href="/pages/profile-settings" className="btn btn-block btn-outline-primary">Go To Profile Settings</Link>
                      </div>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </div>
            </Tab.Container>

          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  local_varaiable: state
});
export default connect(mapStateToProps, { ThemeChanger })(Header);
