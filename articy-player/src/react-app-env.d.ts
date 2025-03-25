/// <reference types="react-scripts" />

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> { }
  interface IntrinsicElements {
    div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
    header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
    button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
  }
}

declare module 'articy-js' {
  export class Database {
    constructor(data: any, assetResolver?: (assetRef: string) => string);
    getObject(id: string, type: any): any;
    startupGameFlowState(startNodeId: string, config: any): [any, any];
    advanceGameFlowState(state: any, config: any, choiceId: string): [any, any];
    refreshBranches(state: any, config: any): any;
  }

  export class DialogueFragment {
    properties: {
      Text: string;
      Speaker?: string;
    };
  }

  export interface GameIterationConfig {
    stopAtTypes: string[];
  }

  export interface ArticyData {
    [key: string]: any;
  }
}

declare module '*.json' {
  const value: any;
  export default value;
} 