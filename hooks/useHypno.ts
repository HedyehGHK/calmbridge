// hooks/useHypno.ts
export type ProcStep = "IDLE" | "DRILL" | "INJECTION";
export type StateTag = "CALM" | "ALERT" | "RECOVER";

type Scripts = {
  anchors: Record<ProcStep, string>;
  script: Record<StateTag, string>;
};

// simple template replace for {{anchor}}
export function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/{{\s*anchor\s*}}/g, vars.anchor ?? "");
}

// load scripts (static require works with Expo)
export function loadScripts(): Scripts {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require("../assets/data/scripts.en.json");
  return data as Scripts;
}
