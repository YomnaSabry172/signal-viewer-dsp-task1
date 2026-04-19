"use client";
import React, { Fragment, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Sidebar from '@/shared/layout-components/sidebar/sidebar';
import Footer from '@/shared/layout-components/footer/footer';
import Switcher from '@/shared/layout-components/switcher/switcher';
import Backtotop from '@/shared/layout-components/backtotop/backtotop';

const ContentLayout = ({ children }) => {

  const [lateLoad, setlateLoad] = useState(false);

  useEffect(() => {
    setlateLoad(true);
  });

  const [MyclassName, setMyClass] = useState("");

  const Bodyclickk = () => {
    if (localStorage.getItem("team16verticalstyles") == "icontext") {
      setMyClass("");
    }
    if (window.innerWidth > 992) {
      let html = document.documentElement;
      if (html.getAttribute('data-icon-overlay') === 'open') {
        html.setAttribute('data-icon-overlay', "");
      }
    }
    document.querySelector(".search-result")?.classList.add("d-none");

  }

  return (
    <>
      <Fragment>
        <div style={{ display: `${lateLoad ? 'block' : 'none'}` }}>
          <Switcher />
          <div className="page">
            <Sidebar />
            <div className="main-content app-content" onClick={Bodyclickk}>
              <div className="container-fluid">
                {children}
              </div>
            </div>
            <Footer />
          </div>
          <Backtotop />
        </div>
      </Fragment>
    </>
  );
};

const mapStateToProps = (state) => ({
  local_varaiable: state
});

export default connect(mapStateToProps, {})(ContentLayout);
