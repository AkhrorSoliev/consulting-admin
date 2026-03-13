// Constants barrel - merges all country sub-lists and exports as default
// so that `import countries from "../utils/constants"` works the same as
// the old `import countries from "../utils/const"`.
import countriesAtoE from "./countriesAtoE";
import countriesFtoK from "./countriesFtoK";
import countriesLtoP from "./countriesLtoP";
import countriesRtoZ from "./countriesRtoZ";

const countries = [
  ...countriesAtoE,
  ...countriesFtoK,
  ...countriesLtoP,
  ...countriesRtoZ,
];

export default countries;
