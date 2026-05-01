declare module "*.css" {
  const content: { readonly [key: string]: string };
  export default content;
}

declare module "*.json" {
  const value: unknown;
  export default value;
}
