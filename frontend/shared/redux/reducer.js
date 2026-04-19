
const initialState = {
    lang: "en",
    dir: "ltr",
    dataThemeMode: "dark",
    dataMenuStyles: "dark",
    dataNavLayout: "vertical",
    dataHeaderStyles: "dark",
    dataVerticalStyle: "detached",
    dataCardBackground: "background1",
    dataCardStyle:"style1",
    dataToggled: "",
    dataNavStyle: "",
    horStyle: "",
    dataPageStyle: "regular",
    dataWidth: "fullwidth",
    dataMenuPosition: "fixed",
    dataHeaderPosition: "fixed",
    patternImg:"bgpattern4",
    iconOverlay: "",
    colorPrimaryRgb: "",
    bgLight:"",
    bgImg: "",
    iconText: "",
    body: {
      class: ""
    },
  };
  
  export default function reducer(state = initialState, action) {
    const { type, payload } = action;
  
    switch (type) {
  
      case "ThemeChanger":
        state = payload;
        return state;
  
      default:
        return state;
    }
  }
  
