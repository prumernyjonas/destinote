// Nouzové deklarace pro React, pokud chybí @types/react v offline prostředí.
// Pokrývá základní hooky a JSX runtime, vše je any pro zachování kompilace.

declare namespace React {
  type ReactNode = any;
  interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): any;
  }
  type FC<P = {}> = FunctionComponent<P>;
}

declare module "react" {
  export = React;
  export as namespace React;

  export const useState: <S = any>(
    initialState: S | (() => S)
  ) => [S, (value: S | ((prev: S) => S)) => void];
  export const useEffect: (
    fn: () => void | (() => void),
    deps?: readonly any[]
  ) => void;
  export const useMemo: any;
  export const useCallback: any;
  export const useRef: any;
  export const useContext: any;
  export const createElement: any;
  export const Fragment: any;

  export type ReactNode = React.ReactNode;
  export type FC<P = {}> = React.FC<P>;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react-dom" {
  const ReactDOM: any;
  export = ReactDOM;
}

declare module "next/navigation" {
  export const useRouter: () => any;
  export const useParams: () => any;
  export const usePathname: () => string;
  export const useSearchParams: () => any;
}
